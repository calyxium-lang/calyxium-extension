import { argv } from "node:process";

const fs = require("fs");

globalThis.require = require;
globalThis.fs = require("fs");
globalThis.path = require("path");
globalThis.TextEncoder = require("util").TextEncoder;
globalThis.TextDecoder = require("util").TextDecoder;

globalThis.performance ??= require("performance");

globalThis.crypto ??= require("crypto");

require(argv[2]);

// @ts-ignore
const go = new Go();
go.argv = process.argv.slice(2);
go.env = Object.assign({ TMPDIR: require("os").tmpdir() }, process.env);
go.exit = process.exit;
// @ts-ignore
WebAssembly.instantiate(fs.readFileSync(argv[3]), go.importObject).then((result) => {
    process.on("exit", (code) => {
        if (code === 0 && !go.exited) {
            go._pendingEvent = { id: 0 };
            go._resume();
        }
    });
    return go.run(result.instance);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});