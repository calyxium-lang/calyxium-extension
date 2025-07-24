import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	type DocumentDiagnosticReport,
	Hover,
	MarkupKind,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false
			},
			hoverProvider: true
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

type MapType<T> = {
	[key: string]: T
}

type DocItem = {
	item: string,
	detail: string,
	documentation: string
}

type DocumentationType = {
	undocumented_auto_completions?: string[],
	documented_auto_completions?: DocItem[]
}

const documentation: MapType<DocumentationType> = {
	"keywords": {
		"undocumented_auto_completions": [
			"rec", "if", "then", "else",
			"let", "match", "with", "return",
			"for", "use", "mod", "true",
			"false", "enum", "struct", "class",
			"extends", "fn", "ref"
		]
	},
	"functions": {
		"documented_auto_completions": [
			{
				"item": "print",
				"detail": "string -> unit",
				"documentation": `
Prints the given string to standard output.
				
@since 0.1.0
				`.trim()
			},
			{
				"item": "input",
				"detail": "A",
				"documentation": "BB"
			},
			{
				"item": "to_bytes",
				"detail": "A",
				"documentation": "BB"
			},
			{
				"item": "to_float",
				"detail": "A",
				"documentation": "BB"
			},
			{
				"item": "to_int",
				"detail": "A",
				"documentation": "BB"
			},
			{
				"item": "length",
				"detail": "A",
				"documentation": "BB"
			},
			{
				"item": "to_string",
				"detail": "A",
				"documentation": "BB"
			},
			{
				"item": "assert",
				"detail": "A",
				"documentation": "BB"
			}
		]
	}
}

const kindMap: MapType<CompletionItemKind> = {
	"function": CompletionItemKind.Function,
	"keyword": CompletionItemKind.Keyword,
}

const completion_objects: CompletionItem[] = []
const completion_documented_objects: Map<number, MapType<string | undefined>> = new Map()

let idx = 1
for (const key of Object.keys(documentation)) {
	const documented_auto_completions = documentation[key].documented_auto_completions;
	const undocumented_auto_completions = documentation[key].undocumented_auto_completions;

	if (documented_auto_completions != undefined) {
		for (const element of documented_auto_completions) {
			completion_objects.push({
				label: element.item,
				kind: kindMap[key],
				data: idx
			})
			completion_documented_objects.set(idx, {
				"detail": element.detail,
				"documentation": element.documentation,
			})
			idx++
		}
	}

	if (undocumented_auto_completions != undefined) {
		for (const element of undocumented_auto_completions) {
			completion_objects.push({
				label: element,
				kind: kindMap[key],
				data: idx
			})
			idx++
		}
	}
}

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings = new Map<string, Thenable<ExampleSettings>>();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = (
			(change.settings.languageServerExample || defaultSettings)
		);
	}
	// Refresh the diagnostics since the `maxNumberOfProblems` could have changed.
	// We could optimize things here and re-fetch the setting first can compare it
	// to the existing setting, but this is out of scope for this example.
	connection.languages.diagnostics.refresh();
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerExample'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});


connection.languages.diagnostics.on(async (params) => {
	const document = documents.get(params.textDocument.uri);
	if (document !== undefined) {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: await validateTextDocument(document)
		} satisfies DocumentDiagnosticReport;
	} else {
		// We don't know the document. We can either try to read it from disk
		// or we don't report problems for it.
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		} satisfies DocumentDiagnosticReport;
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<Diagnostic[]> {
	// In this simple example we get the settings for every validate run.
	const settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}
	return diagnostics;
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return completion_objects;
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		const obj = completion_documented_objects.get(item.data);
		if (obj != undefined) {
			item.detail = obj.detail;
			item.documentation = obj.documentation;
			return item;
		}
		return item;
	}
);

function highlightTypes(typeSignature: string): string {
	const types = ['string', 'int', 'float', 'bool', 'unit', 'byte'];
	const regex = new RegExp(`\\b(${types.join('|')})\\b`, 'g');
	return typeSignature.replace(regex, '$1');
}

connection.onHover(
	async (params): Promise<Hover | null> => {
		const document = documents.get(params.textDocument.uri);
		if (!document) return null;
		const text = document.getText();
		const offset = document.offsetAt(params.position);

		// Find the word at the hover position
		const regex = /\b\w+\b/g;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(text))) {
			if (match.index <= offset && regex.lastIndex >= offset) {
				const word = match[0];

				// Search for the word in your documented completions
				for (const key of Object.keys(documentation)) {
					const documented_auto_completions = documentation[key].documented_auto_completions;
					if (documented_auto_completions) {
						for (const item of documented_auto_completions) {
							if (item.item === word) {
								return {
									contents: {
										kind: MarkupKind.Markdown,
										value: [
											'```ocaml',
											highlightTypes(item.detail || ''),
											'```',
											'',
											item.documentation
										].join('\n')

									}
								};
							}
						}
					}
				}

				break; // stop once we find the word
			}
		}

		return null; // no hover info found
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();