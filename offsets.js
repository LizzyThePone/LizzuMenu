const lizzyjs = require("./build/Release/lizzyjs.node");

let offsets = {
    signatures: {},
    netvars: {}
}

offsets.dwClientState = lizzyjs.engineScan("A1 ? ? ? ? 33 D2 6A 00 6A 00 33 C9 89 B0", 0x1, 0x0)
offsets.dwClientState_GetLocalPlayer = lizzyjs.engineScan("A1 ? ? ? ? 33 D2 6A 00 6A 00 33 C9 89 B0", 0x2, 0x0)