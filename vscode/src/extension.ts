import path = require('path');
import net = require('net');
import { workspace, ExtensionContext } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	StreamInfo,
	TransportKind
} from 'vscode-languageclient/node';

var childProcess = require('child_process');

function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });
}

let client: LanguageClient;

const useTest = true;

export function activate(context: ExtensionContext) {
	let serverOptions: ServerOptions;
	if (!useTest) {
		const lspWasmPath = context.asAbsolutePath(path.join('lib', 'calyxium-lsp.wasm'))
		const wasmRuntimePath = context.asAbsolutePath(path.join('lib', 'wasm_exec.js'))
		const serverPath = context.asAbsolutePath(path.join('out', 'server_wasm.js'))
		
		console.log(serverPath + " " + lspWasmPath)
		const serverOptions: ServerOptions = {
			run: {
				module: serverPath,
				transport: TransportKind.stdio,
				options: {
					execArgv: [serverPath, wasmRuntimePath, lspWasmPath]
				}
			},
			debug: {
				module: serverPath,
				transport: TransportKind.stdio,
				options: {
					execArgv: [serverPath, wasmRuntimePath, lspWasmPath]
				}
			}
		}
	} else {
		serverOptions = () => {
			let socket = net.connect({ port: 7998 })
			let result: StreamInfo = {
				writer: socket,
				reader: socket
			};
			return Promise.resolve(result)
		}
	}

	// const serverOptions: ServerOptions = {
	// 	command: "node",
	// 	transport: TransportKind.stdio,
	// 	args: [serverPath, wasmRuntimePath, lspWasmPath]
	// };

	// const serverOptions: ServerOptions = {
	// 	command: "calyxium-lsp-win-x64",
	// 	transport: TransportKind.stdio,
	// 	args: ["stdio"]
	// };


	// const serverOptions: ServerOptions = {
	// 	run: {
	// 		module: context.asAbsolutePath(
	// 			path.join('out', 'server.js')
	// 		),
	// 		transport: TransportKind.stdio
	// 	},
	// 	debug: {
	// 		module: context.asAbsolutePath(
	// 			path.join('out', 'server.js')
	// 		),
	// 		transport: TransportKind.stdio,
	// 	}
	// };

	// const serverOptions = () => {
	// 	let socket = net.connect({ port: 7998 })
	// 	let result: StreamInfo = {
	// 		writer: socket,
	// 		reader: socket
	// 	};
	// 	return Promise.resolve(result)
	// }

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'calyxium' }],
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	client = new LanguageClient(
		"calyxium-lang",
		"Calyxiym Lang",
		serverOptions,
		clientOptions
	);

	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}