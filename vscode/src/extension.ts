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

let client: LanguageClient;

const devEnv = false;
const useBin = false;

export function activate(context: ExtensionContext) {
	// context.subscriptions.push(commands.registerCommand("format", () => {
	// }))

	let serverOptions: ServerOptions;
	if (!devEnv) {
		const lspWasmPath = context.asAbsolutePath(path.join('lib', 'calyxium-lsp.wasm'))
		const wasmRuntimePath = context.asAbsolutePath(path.join('lib', 'wasm_exec.js'))
		const serverPath = context.asAbsolutePath(path.join('out', 'server_wasm.js'))
		
		serverOptions = {
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
		if (useBin) {
			serverOptions = {
				command: "calyxium-lsp",
				transport: TransportKind.stdio,
				args: ["stdio"]
			};
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
	}

	// const serverOptions: ServerOptions = {
	// 	command: "node",
	// 	transport: TransportKind.stdio,
	// 	args: [serverPath, wasmRuntimePath, lspWasmPath]
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