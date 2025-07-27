package main

import (
	"fmt"
	"io"
	"net/url"
	"os"
	"regexp"
	"strings"

	"github.com/tliron/glsp"
	protocol "github.com/tliron/glsp/protocol_3_16"
)

func onChange(context *glsp.Context, params *protocol.DidChangeTextDocumentParams) error {
	turi := params.TextDocument.URI

	str := ""
	if docs[turi] == nil {
		path, _ := url.PathUnescape(strings.ReplaceAll(turi, "file:///", ""))
		file, _ := os.Open(path)
		content, _ := io.ReadAll(file)
		file.Close()

		docs[turi] = string(content)
		str = string(content)
	} else {
		str = docs[turi].(string)
	}

	for _, change := range params.ContentChanges {
		switch change := change.(type) {
		case protocol.TextDocumentContentChangeEvent:
			{
				start := positionToOffset(str, change.Range.Start)
				end := positionToOffset(str, change.Range.End)
				if start > len(str) || end > len(str) || start > end {
					return fmt.Errorf("invalid range in change")
				}

				updated := []rune(str[:start])
				updated = append(updated, []rune(change.Text)...)
				updated = append(updated, []rune(str[end:])...)

				str = string(updated)
				docs[params.TextDocument.URI] = str
				break
			}
		case protocol.TextDocumentContentChangeEventWhole:
			{
				docs[params.TextDocument.URI] = change.Text
				break
			}
		default:
			panic("OH FUCK")
		}
	}
	return nil
}

func completionInit(context *glsp.Context, params *protocol.CompletionParams) (any, error) {
	return completion_objects, nil
}

func completionResolve(context *glsp.Context, params *protocol.CompletionItem) (*protocol.CompletionItem, error) {
	item := completion_object_map[params.Label]
	if item == nil {
		return params, nil
	}
	params.Detail = item.(protocol.CompletionItem).Detail
	params.Documentation = item.(protocol.CompletionItem).Documentation
	return params, nil
}

func hoverResolve(context *glsp.Context, params *protocol.HoverParams) (*protocol.Hover, error) {
	turi := params.TextDocument.URI

	str := ""
	if docs[turi] == nil {
		path, _ := url.PathUnescape(strings.ReplaceAll(turi, "file:///", ""))
		file, _ := os.Open(path)
		content, _ := io.ReadAll(file)
		file.Close()

		docs[turi] = string(content)
		str = string(content)
	} else {
		str = docs[turi].(string)
	}

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
			if item.(protocol.CompletionItem).Documentation == nil {
				return nil, nil
			}
			return &protocol.Hover{
				Contents: map[string]any{
					"kind":  protocol.MarkupKindMarkdown,
					"value": "```calyxium\n" + *item.(protocol.CompletionItem).Detail + "\n``` " + item.(protocol.CompletionItem).Documentation.(map[string]any)["value"].(string),
				},
			}, nil
		}
	}

	return nil, nil
}
