package main

import (
	"fmt"
	"io"

	"github.com/dop251/goja"
)

var parse func(string) string
var handDoc func(string) map[string]string
var doCodeLense func(map[string]string, string) []map[string]any
var linkComments func(string) map[string]string

func initJS() {
	vm := goja.New()
	vm.Set("console", map[string]func(...any){
		"log": func(v ...any) {
			if !isWASM_BOOL {
				fmt.Println(v)
			}
		},
		"error": func(v ...any) {
			if !isWASM_BOOL {
				fmt.Println("Error: ", v)
			}
		},
	})

	td, err1 := res.Open("resources/EncoderDecoderTogether.min.js")
	if err1 != nil {
		panic(err1)
	}
	b2, _ := io.ReadAll(td)

	_, err4 := vm.RunScript("EncoderDecoderTogether.min.js", string(b2))
	if err4 != nil {
		panic(err4)
	}

	c, err1 := res.Open("resources/parser.js")
	if err1 != nil {
		panic(err1)
	}
	b0, _ := io.ReadAll(c)

	_, err2 := vm.RunScript("parser.js", string(b0))
	if err2 != nil {
		panic(err2)
	}

	c, err0 := res.Open("resources/bindings.bc.js")
	if err0 != nil {
		panic(err0)
	}
	b, _ := io.ReadAll(c)

	_, err := vm.RunScript("bindings.bc.js", string(b))
	if err != nil {
		panic(err)
	}

	function1 := vm.GlobalObject().Get("doCodeLense")
	vm.ExportTo(function1, &doCodeLense)
	function2 := vm.GlobalObject().Get("handleDocument")
	vm.ExportTo(function2, &handDoc)
	function3 := vm.GlobalObject().Get("linkComments")
	vm.ExportTo(function3, &linkComments)
	function := vm.GlobalObject().Get("CalyxiumParse").ToObject(vm).Get("parse")
	vm.ExportTo(function, &parse)

}
