const fs = require("fs-extra");
const skinMap = require("./skins");
const memoryjs = require('memoryjs');
const weaponMap = require("./weapons");
const { getAsyncKeyState } = require('asynckeystate');
const lizzyjs = require("./build/Release/lizzyjs.node");
const { T_STRING } = require("memoryjs");

function getJSON(url) {
    var resp ;
    var xmlHttp ;

    resp  = '' ;
    xmlHttp = new XMLHttpRequest();

    if(xmlHttp != null)
    {
        xmlHttp.open( "GET", url, false );
        xmlHttp.send( null );
        resp = xmlHttp.responseText;
    }

    return JSON.parse(resp) ;
}
//const offsets = getJSON("https://raw.githubusercontent.com/frk1/hazedumper/master/csgo.json");
const offsets = fs.readJSONSync('offsets.json')


let processObject, handle, client, engine, vstdlib, currentTag;
let local = {
    getLocal: () => memoryjs.readMemory(handle, client + offsets.signatures.dwLocalPlayer, memoryjs.INT),
    getInCross: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_iCrosshairId, memoryjs.INT),
    getTeamNum: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_iTeamNum, memoryjs.INT),
    getFlags: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_fFlags, memoryjs.INT),
    getState: () => memoryjs.readMemory(handle, local.getEngineState() + offsets.signatures.dwClientState_State, memoryjs.INT),
    getFlashAlpha: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_flFlashMaxAlpha, memoryjs.FLOAT),
    getFlashDuration: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_flFlashDuration, memoryjs.FLOAT),
    getLocalPlayerTeam: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_iTeamNum, memoryjs.INT),
    getEngineState: () => memoryjs.readMemory(handle, engine + offsets.signatures.dwClientState, memoryjs.DWORD),
    getViewAngles: () => memoryjs.readMemory(handle, local.getEngineState() + offsets.signatures.dwClientState_ViewAngles, memoryjs.VEC3),
    getEyePos: () => memoryjs.readMemory(handle, local.getLocal() + m_vecViewOffset, memoryjs.VEC3),

    forceAttack: () => memoryjs.writeMemory(handle, client + offsets.signatures.dwForceAttack, 6, memoryjs.INT, (err) => { err ? console.error(err) : true }),
    forceClearAttack: () => memoryjs.writeMemory(handle, client + offsets.signatures.dwForceAttack, 5, memoryjs.INT, (err) => { err ? console.error(err) : true }),
    forceLeft: () => memoryjs.writeMemory(handle, client + offsets.signatures.dwForceLeft, 6, memoryjs.INT, (err) => { err ? console.error(err) : true }),
    forceRight: () => memoryjs.writeMemory(handle, client + offsets.signatures.dwForceRight, 6, memoryjs.INT, (err) => { err ? console.error(err) : true }),
    setJumpState: (state) => memoryjs.writeMemory(handle, client + offsets.signatures.dwForceJump, state, memoryjs.INT, (err) => { err ? console.error(err) : true }),
    setFlashAlpha: () => memoryjs.writeMemory(handle, local.getLocal() + offsets.netvars.m_flFlashMaxAlpha, 0.0, memoryjs.FLOAT, (err) => { err ? console.error(err) : true }),
    setFlashDuration: () => memoryjs.writeMemory(handle, local.getLocal() + offsets.netvars.m_flFlashDuration, 0.0, memoryjs.FLOAT, (err) => { err ? console.error(err) : true }),
    setViewAngles: (angles) => memoryjs.writeMemory(handle, local.getEngineState() + offsets.signatures.dwClientState_ViewAngles, normalizeAngles(angles), memoryjs.VEC3, (err) => { err ? console.error(err) : true })
};

let entity = {
    getEntity: (EntId) => memoryjs.readMemory(handle, client + offsets.signatures.dwEntityList + ((EntId) * 0x10), memoryjs.INT),
    getTeamNum: (EntId) => memoryjs.readMemory(handle, entity.getEntity(EntId) + offsets.netvars.m_iTeamNum, memoryjs.INT)
} 

let glow = setInterval( () => {
    if (processObject != undefined && document.getElementById("glowBox").checked){
        for (let i = 1; i < 65; i++){
            let iEntityTeam = memoryjs.readMemory(handle, entity.getEntity(i - 1) + offsets.netvars.m_iTeamNum, memoryjs.INT);
            let bEntityDormant = memoryjs.readMemory(handle, entity.getEntity(i - 1) + offsets.signatures.m_bDormant, memoryjs.INT);
            let iGlowIndex = memoryjs.readMemory(handle, entity.getEntity(i - 1) + offsets.netvars.m_iGlowIndex, memoryjs.INT);
            let dwGlowObjectManager = memoryjs.readMemory(handle, client + offsets.signatures.dwGlowObjectManager, memoryjs.DWORD);
            let ctColor = hexToRgb(document.getElementById("ctColor").value)
            let tColor = hexToRgb(document.getElementById("tColor").value)
            function writeGlow(vector) {
                if (!bEntityDormant || true) {
                    memoryjs.writeMemory(handle, dwGlowObjectManager + (iGlowIndex * 0x38 + 0x4), vector, memoryjs.VEC4, (err) => {err ? console.error(err) : true} );
                    memoryjs.writeMemory(handle, dwGlowObjectManager + (iGlowIndex * 0x38 + 0x24), true, memoryjs.BOOL, (err) => {err ? console.error(err) : true} );
                    memoryjs.writeMemory(handle, dwGlowObjectManager + (iGlowIndex * 0x38 + 0x25), false, memoryjs.BOOL, (err) => {err ? console.error(err) : true} );
                    memoryjs.writeMemory(handle, dwGlowObjectManager + (iGlowIndex * 0x38 + 0x26), false, memoryjs.BOOL, (err) => {err ? console.error(err) : true} );
                    memoryjs.writeMemory(handle, dwGlowObjectManager + (iGlowIndex * 0x38 + 0x27), true, memoryjs.BOOL, (err) => {err ? console.error(err) : true} );
                }
            }
            switch (iEntityTeam) {
                case 3:
                    writeGlow({
                        w: ctColor.r / 255,
                        x: ctColor.g / 255,
                        y: ctColor.b / 255,
                        z: 200 / 255
                    })
                    break;
                case 2:
                    writeGlow({
                        w: tColor.r / 255,
                        x: tColor.g / 255,
                        y: tColor.b / 255,
                        z: 200 / 255
                    })
                    break;
            }
        }
    }
}, 1 )

let queueUpdate = false

let skins = setInterval( () => {
    if (processObject != undefined && document.getElementById("skinChangerBox").checked){
        for (j = 0; j <= 5; j++){
            let WeapEnt = memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_hMyWeapons + j * 0x4, memoryjs.INT) & 0xFFF;
            let weaponBase = memoryjs.readMemory(handle, client + offsets.signatures.dwEntityList + (WeapEnt - 1) * 0x10, memoryjs.INT);
			let id = memoryjs.readMemory(handle, weaponBase + offsets.netvars.m_iItemDefinitionIndex, memoryjs.INT);
            let accountID = memoryjs.readMemory(handle, weaponBase + offsets.netvars.m_OriginalOwnerXuidLow, memoryjs.INT);
            let itemIdHigh = memoryjs.readMemory(handle, weaponBase + offsets.netvars.m_iItemIDHigh, memoryjs.INT);
            let deltaTicks = memoryjs.readMemory(handle, local.getEngineState() + offsets.signatures.clientstate_delta_ticks, memoryjs.INT);
			if (weaponMap.has(id) && weaponMap.get(id).kit) {
                let curPaintKit = memoryjs.readMemory(handle, weaponBase + offsets.netvars.m_nFallbackPaintKit, memoryjs.INT);
				if (curPaintKit != weaponMap.get(id).kit && curPaintKit != -1)
			    {
                    queueUpdate = true
                }

                let seed = (weaponMap.get(id).seed == 0) ? 0 : weaponMap.get(id).seed
                if (weaponMap.get(id).stattrak != 0) {
                    memoryjs.writeMemory(handle, weaponBase + offsets.netvars.m_nFallbackStatTrak, weaponMap.get(id).stattrak, memoryjs.INT);
                }

                //memoryjs.writeMemory(handle, weaponBase + offsets.netvars.m_OriginalOwnerXuidLow, 0, memoryjs.INT);
                //memoryjs.writeMemory(handle, weaponBase + offsets.netvars.m_OriginalOwnerXuidHigh, 0, memoryjs.INT);
			    memoryjs.writeMemory(handle, weaponBase + offsets.netvars.m_nFallbackPaintKit, weaponMap.get(id).kit, memoryjs.INT);
                memoryjs.writeMemory(handle, weaponBase + offsets.netvars.m_nFallbackSeed, seed, memoryjs.INT);

			    memoryjs.writeMemory(handle, weaponBase + offsets.netvars.m_flFallbackWear, 0.0001, memoryjs.FLOAT);
				memoryjs.writeMemory(handle, weaponBase + offsets.netvars.m_iAccountID, accountID, memoryjs.INT);
                memoryjs.writeMemory(handle, weaponBase + offsets.netvars.m_iEntityQuality, 0, memoryjs.INT);
                //memoryjs.writeMemory(handle, weaponBase + offsets.netvars.m_iItemIDHigh, -1, memoryjs.INT);
                if (itemIdHigh != -1){
                    memoryjs.writeMemory(handle, weaponBase + offsets.netvars.m_iItemIDHigh, -1, memoryjs.INT);
                }
                    /*
				    if (nametag != "")
				    {
					    const char* tag = nametag.c_str();
					    WriteProcessMemory(m->hProc, (LPVOID)(weaponBase + offsets::m_szCustomName), tag, sizeof(char[161]), 0);
				    }*/
                    
            }
				
        }
        if (queueUpdate){
            forceUpdate()
        }
    }
}, 20)
let forceUpdating = false
let forceUpdate = () => {
    if (!forceUpdating){
        forceUpdating = true
        memoryjs.writeMemory(handle, local.getEngineState() + offsets.signatures.clientstate_delta_ticks, -1, memoryjs.INT);
        queueUpdate = false
    }
    setTimeout(() => {
        forceUpdating = false
    }, 10);
}


/*
let chams = setInterval( () => {
    if (processObject != undefined && document.getElementById("glowBox").checked){
        for (let i = 1; i < 65; i++){
            let iEntityTeam = memoryjs.readMemory(handle, entity.getEntity(i - 1) + offsets.netvars.m_iTeamNum, memoryjs.INT);
            let bEntityDormant = memoryjs.readMemory(handle, entity.getEntity(i - 1) + offsets.signatures.m_bDormant, memoryjs.INT);
            let ctColor = hexToRgb(document.getElementById("ctColor").value)
            let tColor = hexToRgb(document.getElementById("tColor").value)
            function writeChams(vector) {
                if (!bEntityDormant || true) {
                    memoryjs.writeMemory(handle, entity.getEntity(i - 1) + 0x70, vector.w, memoryjs.BYTE, (err) => {err ? console.error(err) : true} );
                    memoryjs.writeMemory(handle, entity.getEntity(i - 1) + 0x71, vector.x, memoryjs.BYTE, (err) => {err ? console.error(err) : true} );
                    memoryjs.writeMemory(handle, entity.getEntity(i - 1) + 0x72, vector.y, memoryjs.BYTE, (err) => {err ? console.error(err) : true} );
                }
            }
            switch (iEntityTeam) {
                case 3:
                    writeChams({
                        w: ctColor.r,
                        x: ctColor.g,
                        y: ctColor.b,
                        z: 200 / 255
                    })
                    break;
                case 2:
                    writeChams({
                        w: tColor.r,
                        x: tColor.g,
                        y: tColor.b,
                        z: 200 / 255
                    })
                    break;
            }
        }

        let thisPtr = engine + offsets.signatures.model_ambient_min - 0x2c;
        let xored = .5 ^ thisPtr;
        memoryjs.writeMemory(handle, engine + offsets.signatures.model_ambient_min, xored, memoryjs.INT, (err) => {err ? console.error(err) : true} );
    }
}, 1 )*/

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}

let bhop = setInterval( () => {
    if (processObject != undefined && getAsyncKeyState(0x20) && document.getElementById("bhopBox").checked && local.getLocal() != 0 && local.getState() == 6) {
        let iFlags = local.getFlags();
        local.setJumpState( (iFlags === 257) ? 5 : 4);
        //console.log(iFlags)
    }
}, 1 )



let OldAimPunch = {}
let recoil = setInterval( () => {
    if (processObject != undefined && document.getElementById("recoilBox").checked && local.getLocal() != 0 && local.getState() == 6) {
        let vPunch = memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_aimPunchAngle, memoryjs.VEC3)
        let shotsFired = memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_iShotsFired, memoryjs.INT)

        if (shotsFired >= 2) {
            console.log(shotsFired)

            let CurrentViewAngles = local.getViewAngles();
            let NewViewAngles = {}
            NewViewAngles.x = ((CurrentViewAngles.x + OldAimPunch.x) - (vPunch.x * 2));
            NewViewAngles.y = ((CurrentViewAngles.y + OldAimPunch.y) - (vPunch.y * 2));

            OldAimPunch.x = vPunch.x * 2;
            OldAimPunch.y = vPunch.y * 2;

            local.setViewAngles(normalizeAngles(NewViewAngles))

        }
        else
        {
            OldAimPunch.x = 0;
            OldAimPunch.y = 0;
        }

    }
}, 1 )


let noFlash = setInterval( () => {
    if (processObject && document.getElementById("noFlashBox").checked && local.getLocal() != 0 && local.getState() == 6){
        if (local.getFlashAlpha() > 0) {
            local.setFlashAlpha();
        }
        if (local.getFlashDuration() > 0) {
            local.setFlashDuration();
        }
    }
}, 5 )

let autostrafe = setInterval( () => {
    if (processObject != undefined && local.getLocal() != 0 && getAsyncKeyState(0x20) && document.getElementById("autostrafeBox").checked && local.getState() == 6) {
        let currentViewAngle = local.getViewAngles();
        if (local.prevViewAngle === undefined){
            local.prevViewAngle = currentViewAngle
        }
        if (currentViewAngle.y > local.prevViewAngle.y )
		{
            memoryjs.writeMemory(handle, client + offsets.signatures.dwForceLeft, 6, memoryjs.INT, (err) => {err ? console.error(err) : true} )
		}
		else if (currentViewAngle.y < local.prevViewAngle.y)
		{
            memoryjs.writeMemory(handle, client + offsets.signatures.dwForceRight, 6, memoryjs.INT, (err) => {err ? console.error(err) : true} )
        }
        local.prevViewAngle = currentViewAngle
	
    }
}, 1 )

let trigger = setInterval( () => {
    if (processObject != undefined && getAsyncKeyState(0x06) && document.getElementById("triggerBox").checked && local.getLocal() != 0 && local.getState() == 6) {
      let inCrossId = local.getInCross();
      if (inCrossId > 0 && inCrossId <= 64 && entity.getTeamNum(inCrossId - 1) !== local.getTeamNum()) {
        local.forceAttack();
      }
    }
}, 25 )

let userSens

let aimassist = setInterval(() => {
    if (processObject != undefined && getAsyncKeyState(0x06) && document.getElementById("assistBox").checked  && local.getState() == 6) {
        if(userSens == undefined){
            userSens = memoryjs.readMemory(handle, client + offsets.signatures.dwSensitivity, memoryjs.INT);
        }
        for (i = 0; i < 64; i++) {
            let inCrossId = local.getInCross()
            if (inCrossId > 0 && inCrossId <= 64) {
                if (entity.getTeamNum(inCrossId - 1) !== local.getTeamNum()) {
                    memoryjs.writeMemory(handle, client + offsets.signatures.dwSensitivity, 531155266, memoryjs.INT);
                }
            }
            else {
                memoryjs.writeMemory(handle, client + offsets.signatures.dwSensitivity, userSens, memoryjs.INT)
            }
        }
    }
}, 1 )

let normalizeAngles = angles => {
    
	if(angles.x > 89) {
        angles.x = 89;
      }
      if(angles.x < -89) {
        angles.x = -89;
      }
      while(angles.y > 180) {
        angles.y = angles.y - 360;
      }
      while(angles.y < -180) {
        angles.y = angles.y + 360;
      }
      if(angles.y > 180) {
        angles.y = 180;
      }
      if(angles.y < -180) {
        angles.y = -180;
      }
      if(typeof angles.x != 'number' || Number.isNaN(angles.x)) {
        angles.x = 0;
      }
      if(typeof angles.y != 'number' || Number.isNaN(angles.y)) {
        angles.y = 0;
      }
      if(angles.z != 0) {
        angles.z = 0;
      }
      return angles;
}


let radar = setInterval( () => {
    if (processObject != undefined && document.getElementById("radarBox").checked && local.getLocal() != 0 && local.getState() == 6){
        for (var i = 1; i < 65; i++){
            memoryjs.writeMemory(handle, entity.getEntity(i - 1) + offsets.netvars.m_bSpotted, 1, "int");
        }
    }
}, 50)

/*
let grenade = setInterval( () => {
    if (processObject != undefined && document.getElementById("grenadeBox").checked && local.getLocal() != 0 && local.getState() == 6){
        memoryjs.writeMemory(handle, client + 0xCFD7A0, 113, memoryjs.BYTE);
    } else {
        memoryjs.writeMemory(handle, client + 0xCFD7A0, 112, memoryjs.BYTE);
    }
    
})*/

let lagBool = true
let fakeLag = setInterval(() => {
    if (processObject != undefined && document.getElementById("lagBox").checked && local.getLocal() != 0 && local.getState() == 6){
        if (document.getElementById("lagBox").checked) {
            if (lagBool){
                memoryjs.writeMemory(handle, engine + offsets.signatures.dwbSendPackets, false, "bool");
                lagBool = false
            } else {
                memoryjs.writeMemory(handle, engine + offsets.signatures.dwbSendPackets, true, "bool");
                lagBool = true
            }
        } else {
            if (!lagBool) {
                memoryjs.writeMemory(handle, engine + offsets.signatures.dwbSendPackets, true, "bool");
                lagBool = true
            }
        }
    }
}, 50)

function init() {
    memoryjs.openProcess('csgo.exe', (e, process) => {
        if (e) {
            document.title = "Unable to connect to CS:GO, Retrying in 15 seconds...";
            setTimeout(init, 15000);
            console.log("Retry finding CS:GO in 15 seconds...")
        } else {
            document.title = "LizzuMenu";
            processObject = process;
            handle = processObject.handle;
            client = memoryjs.findModule('client.dll', processObject.th32ProcessID).modBaseAddr;
            engine = memoryjs.findModule('engine.dll', processObject.th32ProcessID).modBaseAddr;
            vstdlib = memoryjs.findModule('vstdlib.dll', processObject.th32ProcessID).modBaseAddr;
            scanPatterns();
        }
    });
    weaponMap.forEach((v,k) => {
        document.getElementById("gunlist").innerHTML = document.getElementById("gunlist").innerHTML + `<option class="gunItem" onclick="setGun()" id="gun${k}"> ${v.name} </option>`
    })

    skinMap.forEach((v,k) => {
        if (v.name == "None"){
            document.getElementById("skinlist").innerHTML = document.getElementById("skinlist").innerHTML + `<option class="skinItem" onclick="setSkin()" id="skin${k}" selected="true"> ${v.name} </option>`
        } else {
            document.getElementById("skinlist").innerHTML = document.getElementById("skinlist").innerHTML + `<option class="skinItem" onclick="setSkin()" id="skin${k}"> ${v.name} </option>`
        }
        
    })

    loadConfig()
}


let openPanel = panel => {
    for (let x of document.getElementsByClassName("menupanel")) {
        if (x.id == panel) {
            x.hidden = false;
        } else {
            x.hidden = true;
        }
    }
}

let setSkin = () => {
    let selectedWeaponId = parseInt(document.getElementById('gunlist').options[document.getElementById('gunlist').selectedIndex].id.replace('gun', ""))
    let selectedSkinId = parseInt(document.getElementById('skinlist').options[document.getElementById('skinlist').selectedIndex].id.replace('skin', ""))
    let weapon = weaponMap.get(selectedWeaponId)
    weapon.kit = selectedSkinId
    weapon.seed = (document.getElementById('seedBox').value == "") ? 0 : parseInt(document.getElementById('seedBox').value)
    weapon.stattrak = (document.getElementById('stattrakBox').value == "") ? 0 : parseInt(document.getElementById('stattrakBox').value)
    document.getElementById('kitBox').value = weapon.kit
    document.getElementById('kitNameBox').value = document.getElementById(`skin${weapon.kit}`).innerHTML.trim()

    weaponMap.set(selectedWeaponId, weapon)
}

let setGun = () => {
    let selectedWeaponId = parseInt(document.getElementById('gunlist').options[document.getElementById('gunlist').selectedIndex].id.replace('gun', ""))
    let weapon = weaponMap.get(selectedWeaponId)
    if (weapon.kit) {
        document.getElementById('skinlist').options[document.getElementById('skinlist').selectedIndex].selected = false
        document.getElementById(`skin${weapon.kit}`).selected = true
        document.getElementById('seedBox').value = weapon.seed
        document.getElementById('stattrakBox').value = weapon.stattrak
        document.getElementById('kitBox').value = weapon.kit
        document.getElementById('kitNameBox').value = document.getElementById(`skin${weapon.kit}`).innerHTML.trim()
    } else {
        document.getElementById('skinlist').options[document.getElementById('skinlist').selectedIndex].selected = false
        document.getElementById(`skin0`).selected = true
        document.getElementById('seedBox').value = 0
        document.getElementById('stattrakBox').value = 0
        document.getElementById('kitBox').value = 0
        document.getElementById('kitNameBox').value = document.getElementById(`skin0`).innerHTML.trim()
    }
    weaponMap.set(selectedWeaponId, weapon)
}

let filterSkins = () => {
    for (let x of document.getElementsByClassName("skinItem")) {
        if (x.innerHTML.trim().toLocaleLowerCase().startsWith(document.getElementById('kitNameBox').value.toLocaleLowerCase())) {
            x.hidden = false;
        } else {
            x.hidden = true;
        }
    }
}

let saveConfig = () => {
    let saveObject = {}
    saveObject.bhop = document.getElementById('bhopBox').checked
    saveObject.autostrafe = document.getElementById('autostrafeBox').checked
    saveObject.radar = document.getElementById('radarBox').checked
    saveObject.noFlash = document.getElementById('noFlashBox').checked
    saveObject.trigger = document.getElementById('triggerBox').checked
    saveObject.recoil = document.getElementById('recoilBox').checked
    saveObject.lag = document.getElementById('lagBox').checked
    saveObject.assist = document.getElementById('assistBox').checked
    saveObject.glow = document.getElementById('glowBox').checked
    saveObject.staticTag = document.getElementById('staticTagBox').checked
    saveObject.scrollTag = document.getElementById('scrollTagBox').checked
    saveObject.buildTag = document.getElementById('buildTagBox').checked
    saveObject.nlTag = document.getElementById('nlTagBox').checked

    saveObject.tColor = document.getElementById('tColor').value
    saveObject.ctColor = document.getElementById('ctColor').value
    saveObject.tag = document.getElementById('tagbox').value
    saveObject.tagInterval = document.getElementById('tagintervalbox').value

    fs.outputJson("config.json", saveObject)
}

let loadConfig = () => {
    if (fs.pathExistsSync('config.json')) {
        let saveObject = fs.readJsonSync('config.json')
        document.getElementById('bhopBox').checked = saveObject.bhop
        document.getElementById('autostrafeBox').checked = saveObject.autostrafe
        document.getElementById('radarBox').checked = saveObject.radar
        document.getElementById('noFlashBox').checked = saveObject.noFlash
        document.getElementById('triggerBox').checked = saveObject.trigger
        document.getElementById('recoilBox').checked = saveObject.recoil
        document.getElementById('lagBox').checked = saveObject.lag
        document.getElementById('assistBox').checked = saveObject.assist
        document.getElementById('glowBox').checked = saveObject.glow
        document.getElementById('staticTagBox').checked = saveObject.staticTag
        document.getElementById('scrollTagBox').checked = saveObject.scrollTag
        document.getElementById('buildTagBox').checked = saveObject.buildTag
        document.getElementById('nlTagBox').checked = saveObject.nlTag

        document.getElementById('tColor').value = saveObject.tColor
        document.getElementById('ctColor').value = saveObject.ctColor
        document.getElementById('tagbox').value = saveObject.tag
        document.getElementById('tagintervalbox').value = saveObject.tagInterval
    }
}



window.addEventListener('DOMContentLoaded', () => {
    init();
})

let tagTimeout

let setClanTagButton = () => {
    clearInterval(tagTimeout)
    if (document.getElementById('staticTagBox').checked){
        setClanTag(document.getElementById('tagbox').value)
    } 
    if (document.getElementById('scrollTagBox').checked || document.getElementById('buildTagBox').checked || document.getElementById('gamesenseTagBox').checked){
        let originalTag = unescape(document.getElementById('tagbox').value)
        let currentTag = originalTag
        let direction = true
        let position = 0
        tag = () => {
            if (document.getElementById('scrollTagBox').checked){
                let z = currentTag.substring(1)
                currentTag = z + currentTag.charAt(0)
                setClanTag(currentTag)
                tagTimeout = setTimeout(tag, document.getElementById('tagintervalbox').value)
            }
            if (document.getElementById('buildTagBox').checked){
                if (direction){
                    position++
                } else {
                    position--
                }
                setClanTag(originalTag.substring(0, position))
                if(position == originalTag.length || position == 0){
                    direction = !direction
                }
                tagTimeout = setTimeout(tag, document.getElementById('tagintervalbox').value)
            }
            if (document.getElementById('gamesenseTagBox').checked){
                let curtime = memoryjs.readMemory(handle, local.getEngineState() + offsets.signatures.clientstate_delta_ticks, memoryjs.INT)
                console.log(curtime)
                switch ((curtime * 2.4) % 27)
				{
				case 0: setClanTag( "                   "); break;
				case 1: setClanTag( "                 g "); break;
				case 2: setClanTag( "                ga "); break;
				case 3: setClanTag( "               gam "); break;
				case 4: setClanTag( "              game "); break;
				case 5: setClanTag( "             games "); break;
				case 6: setClanTag( "            gamese "); break;
				case 7: setClanTag( "           gamesen "); break;
				case 8: setClanTag( "          gamesens "); break;
				case 9: setClanTag( "         gamesense "); break;
				case 10:setClanTag( "        gamesense  "); break;
				case 11:setClanTag( "       gamesense   "); break;
				case 12:setClanTag( "      gamesense    "); break;
				case 13:setClanTag( "     gamesense     "); break;
				case 14:setClanTag( "    gamesense      "); break;
				case 15:setClanTag( "   gamesense       "); break;
				case 16:setClanTag( "  gamesense        "); break;
				case 17:setClanTag( " gamesense         "); break;
				case 18:setClanTag( "gamesense          "); break;
				case 19:setClanTag( "amesense           "); break;
				case 20:setClanTag( "mesense            "); break;
				case 22:setClanTag( "esense             "); break;
				case 23:setClanTag( "sense              "); break;
				case 24:setClanTag( "ense               "); break;
				case 25:setClanTag( "nse                "); break;
				case 26:setClanTag( "se                 "); break;
				case 27:setClanTag( "e                  "); break;
				}
                tagTimeout = setTimeout(tag, 1)
            }
        }
        tag()
    } 
}

let setClanTag = (tag) => {
    if (local.getState() == 6){
        let append = document.getElementById('nlTagBox').checked ? " \n" : ""
        console.log(tag + append)
        lizzyjs.setClanTag(handle, engine + offsets.signatures.dwSetClanTag, tag + append)
    }
    document.getElementById('tagDisplay').innerHTML = tag
}

let getcvar = (str) => {
    let m_pICVar = memoryjs.readMemory(handle, vstdlib + offsets.signatures.interface_engine_cvar, memoryjs.INT);

	let hashMapEntry;
 
		if (m_pICVar != 0)
		{

			let shortCuts = memoryjs.readMemory(handle, m_pICVar + 52, memoryjs.INT);
			hashMapEntry = memoryjs.readMemory(handle, shortCuts, memoryjs.INT);
 

			while (hashMapEntry != 0)
			{
				var pConVar = memoryjs.readMemory(handle, hashMapEntry + 4, memoryjs.INT);
				var pConVarName = memoryjs.readMemory(handle, memoryjs.readMemory(handle, pConVar + 12, memoryjs.INT), memoryjs.STRING)
				if (pConVarName.toLowerCase() == str)
				{
                    return pConVar;
				}
				hashMapEntry = memoryjs.readMemory(handle, hashMapEntry + 4, memoryjs.INT);
			}
		}
}

let readcvar = (str) => {
    //console.log(memoryjs.readMemory(handle, getcvar(str) + 0x30, memoryjs.INT) ^ getcvar(str));
    return memoryjs.readMemory(handle, getcvar(str) + 0x30, memoryjs.INT) ^ getcvar(str);
}


let writecvar = (str, value, valueType) => {
    //memoryjs.writeMemory(handle, getcvar(str) + 0x50, 0, memoryjs.INT);
    memoryjs.writeMemory(handle, getcvar(str) + 0x14, 0, memoryjs.INT);
    memoryjs.writeMemory(handle, getcvar(str) + 0x30, value, memoryjs.FLOAT);
    //memoryjs.writeMemory(handle, getcvar(str) + 0x50, 0, memoryjs.INT);
}

/*
let ragdoll = setInterval( () => {
    if (readcvar('cl_ragdoll_gravity') !== 0 || readcvar('sv_cheats') !== 1){
        writecvar('sv_cheats', 1)
        writecvar('cl_ragdoll_gravity', 0)
        console.log('Wrote cl_ragdoll_gavity to 0')
    }
}, 1)*/


let scanPatterns = async () => {/*
    offsets.signatures.dwClientState = await lizzyjs.engineScan("A1 ? ? ? ? 33 D2 6A 00 6A 00 33 C9 89 B0", 0x1, 0x0)
    offsets.signatures.dwLocalPlayer = await lizzyjs.clientScan("8D 34 85 ? ? ? ? 89 15 ? ? ? ? 8B 41 08 8B 48 04 83 F9 FF", 0x1, 0x10)
    offsets.signatures.dwSetClanTag = await lizzyjs.engineScan("A1 ? ? ? ? 8B 0C B0 8B 01 FF 50 ? 46 3B 35 ? ? ? ? 7C EA 8B 0D", 0x0, 0x0)
    offsets.signatures.dwbSendPackets = await lizzyjs.engineScan("B3 01 8B 01 8B 40 10 FF D0 84 C0 74 0F 80 BF ? ? ? ? ? 0F 84", 0x0, 0x0)
    offsets.signatures.dwGlowObjectManager = await lizzyjs.clientScan("8D 34 85 ? ? ? ? 89 15 ? ? ? ? 8B 41 08 8B 48 04 83 F9 FF", 0x1, 0x4)
    //offsets.signatures.dwSensitivity = await lizzyjs.clientScan("81 F9 ? ? ? ? 75 1D F3 0F 10 05 ? ? ? ? F3 0F 11 44 24 ? 8B 44 24 0C 35 ? ? ? ? 89 44 24 0C", 0x1, 44)
    offsets.signatures.dwForceLeft = await lizzyjs.clientScan("55 8B EC 51 53 8A 5D 08", 0x0, 465)
    offsets.signatures.dwForceRight = await lizzyjs.clientScan("55 8B EC 51 53 8A 5D 08", 0x0, 512)
    offsets.signatures.dwForceJump = await lizzyjs.clientScan("8B 0D ? ? ? ? 8B D6 8B C1 83 CA 02", 0x0, 0x2)
    offsets.signatures.dwForceAttack = await lizzyjs.clientScan("89 0D ? ? ? ? 8B 0D ? ? ? ? 8B F2 8B C1 83 CE 04", 0x0, 0x2)
    offsets.signatures.dwEntityList = await lizzyjs.clientScan("BB ? ? ? ? 83 FF 01 0F 8C ? ? ? ? 3B F8", 0x0, 0x1)*/
}

let consoleCMD = command => {
    const clientCMD = lizzyjs.engineScan("55 8B EC 8B 0D ? ? ? ? 81 F9 ? ? ? ? 75 0C A1 ? ? ? ? 35 ? ? ? ? EB 05 8B 01 FF 50 34 50", 0x1, 0x0) // Custom 
    lizzyjs.console(handle, memoryjs.findModule('engine.dll', processObject.th32ProcessID).modBaseSize + clientCMD, command)  // C++ function "Console()"
}

function getClosest() {
    let w2sHead, aimPlayer, lowestDist = 6969;
    
    for (var i = 1; i < 65; i++){
        let ent = entity.getEntity(i)
        if (entity.getTeamNum(ent) !== local.getTeamNum()) {
            local.forceAttack();
        }
    }
    
}