const memoryjs = require('memoryjs');
const lizzyjs = require("./build/Release/lizzyjs.node")

const { getAsyncKeyState } = require('asynckeystate');
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
const offsets = getJSON("https://raw.githubusercontent.com/frk1/hazedumper/master/csgo.json");

let processObject, handle, client, engine, vstdlib, currentTag;
let local = {
    getLocal: () => memoryjs.readMemory(handle, client + offsets.signatures.dwLocalPlayer, memoryjs.INT),
    getInCross: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_iCrosshairId, memoryjs.INT),
    getTeamNum: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_iTeamNum, memoryjs.INT),
    getFlags: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_fFlags, memoryjs.INT),
    getFlashAlpha: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_flFlashMaxAlpha, memoryjs.FLOAT),
    getFlashDuration: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_flFlashDuration, memoryjs.FLOAT),
    getLocalPlayerTeam: () => memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_iTeamNum, memoryjs.INT),
    getEngineState: () => memoryjs.readMemory(handle, engine + offsets.signatures.dwClientState, memoryjs.DWORD),
    getViewAngles: () => memoryjs.readMemory(handle, local.getEngineState() + offsets.signatures.dwClientState_ViewAngles, memoryjs.VEC3),

    forceAttack: () => memoryjs.writeMemory(handle, client + offsets.signatures.dwForceAttack, 6, memoryjs.INT, (err) => { err ? console.error(err) : true }),
    forceLeft: () => memoryjs.writeMemory(handle, client + offsets.signatures.dwForceLeft, 6, memoryjs.INT, (err) => { err ? console.error(err) : true }),
    forceRight: () => memoryjs.writeMemory(handle, client + offsets.signatures.dwForceRight, 6, memoryjs.INT, (err) => { err ? console.error(err) : true }),
    setJumpState: (state) => memoryjs.writeMemory(handle, client + offsets.signatures.dwForceJump, state, memoryjs.INT, (err) => { err ? console.error(err) : true }),
    setFlashAlpha: () => memoryjs.writeMemory(handle, local.getLocal() + offsets.netvars.m_flFlashMaxAlpha, 0.0, memoryjs.FLOAT, (err) => { err ? console.error(err) : true }),
    setFlashDuration: () => memoryjs.writeMemory(handle, local.getLocal() + offsets.netvars.m_flFlashDuration, 0.0, memoryjs.FLOAT, (err) => { err ? console.error(err) : true }),
    setViewAngles: (angles) => memoryjs.writeMemory(handle, local.getEngineState() + offsets.signatures.dwClientState_ViewAngles, angles, memoryjs.VEC3, (err) => { err ? console.error(err) : true })
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

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}

let bhop = setInterval( () => {
    if (processObject != undefined && getAsyncKeyState(0x20) && document.getElementById("bhopBox").checked) {
        let iFlags = local.getFlags();
        local.setJumpState( (iFlags === 257) ? 5 : 4);
        console.log(iFlags)
    }
}, 1 )

let OldAimPunch = {}
let recoil = setInterval( () => {
    if (processObject != undefined && document.getElementById("recoilBox").checked) {
        let vPunch = memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_aimPunchAngle, memoryjs.VEC3)
        let shotsFired = memoryjs.readMemory(handle, local.getLocal() + offsets.netvars.m_iShotsFired, memoryjs.INT)

        if (shotsFired >= 2) {

            let CurrentViewAngles = local.getViewAngles();
            let NewViewAngles = {}
            NewViewAngles.x = ((CurrentViewAngles.x + OldAimPunch.x) - (vPunch.x * 2));
            NewViewAngles.y = ((CurrentViewAngles.y + OldAimPunch.y) - (vPunch.y * 2));

            while (NewViewAngles.y > 180)
                NewViewAngles.y -= 360;

            while (NewViewAngles.y < -180)
                NewViewAngles.y += 360;

            if (NewViewAngles.x > 89.0)
                NewViewAngles.x = 89.0;

            if (NewViewAngles.x < -89.0)
                NewViewAngles.x = -89.0;

            OldAimPunch.x = vPunch.x * 2;
            OldAimPunch.y = vPunch.y * 2;

            local.setViewAngles(NewViewAngles)

        }
        else
        {
            OldAimPunch.x = 0;
            OldAimPunch.y = 0;
        }

    }
}, 1 )


let noFlash = setInterval( () => {
    if (processObject && document.getElementById("noFlashBox").checked){
        if (local.getFlashAlpha() > 0) {
            local.setFlashAlpha();
        }
        if (local.getFlashDuration() > 0) {
            local.setFlashDuration();
        }
    }
}, 5 )

let autostrafe = setInterval( () => {
    if (processObject != undefined && getAsyncKeyState(0x20) && document.getElementById("autostrafeBox").checked) {
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
    if (processObject != undefined && getAsyncKeyState(0x06) && document.getElementById("triggerBox").checked) {
      let inCrossId = local.getInCross();
      if (inCrossId > 0 && inCrossId <= 64 && entity.getTeamNum(inCrossId - 1) !== local.getTeamNum()) {
        local.forceAttack();
      }
    }
}, 50 )

let radar = setInterval( () => {
    if (processObject != undefined && document.getElementById("radarBox").checked){
        for (var i = 1; i < 65; i++){
            memoryjs.writeMemory(handle, entity.getEntity(i - 1) + offsets.netvars.m_bSpotted, 1, "int");
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
        }
    });
}



window.addEventListener('DOMContentLoaded', () => {
    init();
})

let scrollTag = () => {
    let originalTag = document.getElementById('tagbox').value
    let currentTag = originalTag
    return setInterval(() => {
        let z = currentTag.substring(1)
        currentTag = z + currentTag.charAt(0)
        setClanTag(currentTag)
    }, 500);
} 

let setClanTagButton = () => {
    if (document.getElementById('staticTagBox').checked){
        setClanTag(document.getElementById('tagbox').value)
    } 
    if (document.getElementById('scrollTagBox').checked){
        let originalTag = document.getElementById('tagbox').value
        let currentTag = originalTag
        tag = () => {
            if (document.getElementById('scrollTagBox').checked){
                let z = currentTag.substring(1)
                currentTag = z + currentTag.charAt(0)
                setClanTag(currentTag)
                setTimeout(tag, 600)
            }
        }
        tag()
    } 
}

let setClanTag = (tag) => {
    lizzyjs.setClanTag(handle, engine + offsets.signatures.dwSetClanTag, " " + tag)
    console.log(`Set tag to ${tag}`)
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

let openPanel = panel => {
    for (let x of document.getElementsByClassName("menupanel")) {
        if (x.id == panel) {
            x.hidden = false;
        } else {
            x.hidden = true;
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
    memoryjs.writeMemory(handle, getcvar(str) + 0x2C, value ^ getcvar(str), memoryjs.FLOAT);
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

