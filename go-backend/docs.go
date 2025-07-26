package main

import (
	"encoding/json"
	"fmt"
	"io"

	protocol "github.com/tliron/glsp/protocol_3_16"
)

var completion_objects = make([]protocol.CompletionItem, 0)
var completion_object_map map[string]any

func initDocJson() {
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
		"function":  protocol.CompletionItemKindFunction,
		"keyword":   protocol.CompletionItemKindKeyword,
		"snippet":   protocol.CompletionItemKindSnippet,
		"operators": protocol.CompletionItemKindOperator,
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
}
