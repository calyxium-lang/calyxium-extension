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

const connection = createConnection(ProposedFeatures.all);

const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

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

const kindMap: MapType<CompletionItemKind> = {
	"function": CompletionItemKind.Function,
	"keyword": CompletionItemKind.Keyword,
}

const completion_objects: CompletionItem[] = []
const completion_documented_objects: Map<number, DocItem> = new Map()
const documented_objects: Map<string, DocItem> = new Map()

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
                "documentation": "\nPrints the given string to standard output.\n\n@since 0.1.0"
            },
            {
                "item": "input",
                "detail": "string -> unit",
                "documentation": ""
            },
            {
                "item": "to_bytes",
                "detail": "string -> []byte",
                "documentation": ""
            },
            {
                "item": "to_float",
                "detail": "(string -> int) -> float",
                "documentation": ""
            },
            {
                "item": "to_int",
                "detail": "(byte -> string -> float) -> int",
                "documentation": ""
            },
            {
                "item": "length",
                "detail": "unit -> int",
                "documentation": ""
            },
            {
                "item": "to_string",
                "detail": "unit -> string",
                "documentation": ""
            },
            {
                "item": "assert",
                "detail": "bool -> bool",
                "documentation": ""
            }
        ]
    }
}

connection.onInitialized(() => {
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
				completion_documented_objects.set(idx, element)
				documented_objects.set(element.item, element)
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

	if (hasConfigurationCapability) {
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

interface ExampleSettings {
	maxNumberOfProblems: number;
}

const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

const documentSettings = new Map<string, Thenable<ExampleSettings>>();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		documentSettings.clear();
	} else {
		globalSettings = (
			(change.settings.languageServerExample || defaultSettings)
		);
	}
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
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		} satisfies DocumentDiagnosticReport;
	}
});

documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<Diagnostic[]> {
	const settings = await getDocumentSettings(textDocument.uri);

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
	connection.console.log('We received a file change event');
});

connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		return completion_objects;
	}
);

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

		const regex = /\b\w+\b/g;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(text))) {
			if (match.index <= offset && regex.lastIndex >= offset) {
				const word = match[0].trim();

				const obj = documented_objects.get(word)
				if (obj == null) return null;

				return {
						contents: {
							kind: MarkupKind.Markdown,
							value: [
								'```ocaml',
								highlightTypes(obj.detail || ''),
								'```',
								'',
								obj.documentation
							].join('\n')
							}
				};
			}
		}

		return null;
	}
);

documents.listen(connection);

connection.listen();