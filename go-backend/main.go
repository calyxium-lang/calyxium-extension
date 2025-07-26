package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"os"
	"regexp"
	"strings"

	"github.com/tliron/commonlog"
	"github.com/tliron/glsp"
	protocol "github.com/tliron/glsp/protocol_3_16"
	"github.com/tliron/glsp/server"

	// Must include a backend implementation
	// See CommonLog for other options: https://github.com/tliron/commonlog
	_ "github.com/tliron/commonlog/simple"
)

const lsName = "Calyxium"

var (
	version string = "0.0.1"
	handler protocol.Handler
)

var (
	//go:embed resources
	res embed.FS
)

var completion_objects = make([]protocol.CompletionItem, 0)
var completion_object_map map[string]any

func main() {
	// This increases logging verbosity (optional)
	commonlog.Configure(1, nil)

	handler = protocol.Handler{
		Initialize:  initialize,
		Initialized: initialized,
		// TextDocumentCodeAction: func(context *glsp.Context, params *protocol.CodeActionParams) (any, error) {
		// 	params.
		// },
		CompletionItemResolve: func(context *glsp.Context, params *protocol.CompletionItem) (*protocol.CompletionItem, error) {
			item := completion_object_map[params.Label]
			if item == nil {
				return params, nil
			}
			params.Detail = item.(protocol.CompletionItem).Detail
			params.Documentation = item.(protocol.CompletionItem).Documentation
			return params, nil
		},
		TextDocumentCompletion: func(context *glsp.Context, params *protocol.CompletionParams) (any, error) {
			return completion_objects, nil
		},
		TextDocumentHover: func(context *glsp.Context, params *protocol.HoverParams) (*protocol.Hover, error) {
			turi := params.TextDocument.URI

			path, _ := url.PathUnescape(strings.ReplaceAll(turi, "file:///", ""))
			file, _ := os.Open(path)
			content, _ := io.ReadAll(file)
			file.Close()

			str := string(content)

			idx := params.Position.IndexIn(str)

			rgx, _ := regexp.Compile(`\b\w+\b`)
			matches := rgx.FindAllStringIndex(str, -1)
			for _, a := range matches {
				if a[0] <= idx && a[1] >= idx {
					word := str[a[0]:a[1]]
					item := completion_object_map[word]
					if item == nil {
						return nil, nil
					}
					return &protocol.Hover{
						Contents: map[string]any{
							"kind":  protocol.MarkupKindMarkdown,
							"value": "```ocaml\n" + *item.(protocol.CompletionItem).Detail + "\n``` " + item.(protocol.CompletionItem).Documentation.(map[string]any)["value"].(string),
						},
					}, nil
				}
			}

			return nil, nil
		},
		Shutdown: shutdown,
		SetTrace: setTrace,
	}

	server := server.NewServer(&handler, lsName, false)

	server.RunTCP("127.0.0.1:7998")

	for {
	}
}

func initialize(context *glsp.Context, params *protocol.InitializeParams) (any, error) {
	capabilities := handler.CreateServerCapabilities()

	es, _ := res.ReadDir(".")
	for _, e := range es {
		fmt.Println(e)
	}
	jsonFile, err := res.Open("resources/documentation.json")
	if err != nil {
		fmt.Println(err)
	}
	defer jsonFile.Close()

	bytes, _ := io.ReadAll(jsonFile)

	var result map[string]any
	completion_object_map = map[string]any{}

	json.Unmarshal([]byte(bytes), &result)

	kindMap := map[string]protocol.CompletionItemKind{
		"function": protocol.CompletionItemKindFunction,
		"keyword":  protocol.CompletionItemKindKeyword,
	}

	idx := 1

	for k := range result {
		kind := kindMap[k]

		undocumented_auto_completions := (result[k].(map[string]any))["undocumented_auto_completions"]
		documented_auto_completions := (result[k].(map[string]any))["documented_auto_completions"]

		if undocumented_auto_completions != nil {
			for _, obj := range undocumented_auto_completions.([]any) {
				item := protocol.CompletionItem{
					Label: obj.(string),
					Kind:  &kind,
					Data:  idx,
				}

				completion_object_map[obj.(string)] = item
				completion_objects = append(completion_objects, item)
				idx++
			}
		}
		if documented_auto_completions != nil {
			for _, d := range documented_auto_completions.([]any) {
				obj := d.(map[string]any)

				detail := obj["detail"].(string)
				documentation := obj["documentation"].(string)
				name := obj["item"].(string)

				item := protocol.CompletionItem{
					Label:  name,
					Kind:   &kind,
					Data:   idx,
					Detail: &detail,
					Documentation: map[string]any{
						"kind":  protocol.MarkupKindMarkdown,
						"value": documentation,
					},
				}

				completion_object_map[name] = item
				completion_objects = append(completion_objects, item)
				idx++
			}
		}
	}

	return protocol.InitializeResult{
		Capabilities: capabilities,
		ServerInfo: &protocol.InitializeResultServerInfo{
			Name:    lsName,
			Version: &version,
		},
	}, nil
}

func initialized(context *glsp.Context, params *protocol.InitializedParams) error {
	return nil
}

func shutdown(context *glsp.Context) error {
	protocol.SetTraceValue(protocol.TraceValueOff)
	return nil
}

func setTrace(context *glsp.Context, params *protocol.SetTraceParams) error {
	protocol.SetTraceValue(params.Value)
	return nil
}
