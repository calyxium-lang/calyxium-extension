package main

import (
	"embed"
	"fmt"
	"io"
	"net/url"
	"os"
	"reflect"
	"strings"
	"sync"

	"github.com/tliron/commonlog"
	"github.com/tliron/glsp"
	protocol "github.com/tliron/glsp/protocol_3_16"
	"github.com/tliron/glsp/server"

	// Must include a backend implementation
	// See CommonLog for other options: https://github.com/tliron/commonlog
	_ "github.com/tliron/commonlog/simple"
)

var (
	isWASM      string
	isWASM_BOOL bool
)

const lsName = "calyxium-lang"

var (
	version string = "0.0.1"
	handler protocol.Handler
)

var (
	//go:embed resources
	res embed.FS
)

var wg sync.WaitGroup

func main() {
	isWASM_BOOL = isWASM == "true"

	initDocJson()

	// This increases logging verbosity (optional)
	commonlog.Configure(1, nil)

	handler = protocol.Handler{
		Initialize:             initialize,
		Initialized:            initialized,
		CompletionItemResolve:  completionResolve,
		TextDocumentCompletion: completionInit,
		TextDocumentHover:      hoverResolve,
		Shutdown:               shutdown,
		TextDocumentDidChange: func(context *glsp.Context, params *protocol.DidChangeTextDocumentParams) error {
			turi := params.TextDocument.URI

			path, _ := url.PathUnescape(strings.ReplaceAll(turi, "file:///", ""))
			file, _ := os.Open(path)
			content, _ := io.ReadAll(file)
			file.Close()

			str := string(content)

			fmt.Println(reflect.TypeOf(params.ContentChanges[0]))
			if reflect.TypeOf(params.ContentChanges[0]).String() == "protocol.TextDocumentContentChangeEvent" {
				a, b := params.ContentChanges[0].(protocol.TextDocumentContentChangeEvent).Range.IndexesIn(str)

				//TODO: Figure out how to apply updated to existing document
				// params.
				fmt.Println(str[a:b])
			}
			return nil
		},
		SetTrace: setTrace,
	}

	server := server.NewServer(&handler, lsName, false)

	if isWASM_BOOL {
		server.RunStdio()
	}

	if len(os.Args) == 2 {
		if os.Args[1] == "stdio" {
			server.RunStdio()
		}
	}

	server.RunTCP("127.0.0.1:7998")

	for {
	}
}

func initialize(context *glsp.Context, params *protocol.InitializeParams) (any, error) {
	capabilities := handler.CreateServerCapabilities()

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
