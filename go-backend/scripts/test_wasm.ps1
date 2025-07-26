New-Item bin -Type Directory -Force | Out-Null

New-Item bin/js -Type Directory -Force | Out-Null
$Env:GOOS="js";
$Env:GOARCH="wasm"; & go build -ldflags "-X main.isWASM=true" -o "bin/js/calyxium-lsp-js.wasm"

node "$(go env GOROOT)/lib/wasm/wasm_exec_node.js" "bin/js/calyxium-lsp-js.wasm"