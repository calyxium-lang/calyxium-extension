package main

import (
	"fmt"
	"strings"
)

func parseFile(uri, f string) map[string]string {
	source := strings.ReplaceAll(strings.TrimSpace(f), "\r", "")
	if source == "" {
		functionDocumentations[uri] = nil
		return nil
	}

	functionDocumentations[uri] = linkComments(source)

	out := parse(functionDocumentations[uri]["-source"])
	if strings.Contains(out, "Error") {
		if !isWASM_BOOL {
			fmt.Println("parser error: " + out)
		}
		if functionTypeSignatures[uri] == nil {
			return nil
		}
		return functionTypeSignatures[uri]
	}
	return handDoc(out)
}
