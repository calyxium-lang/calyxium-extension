New-Item bin -Type Directory -Force | Out-Null

New-Item bin/js -Type Directory -Force | Out-Null
$Env:GOOS="js";
$Env:GOARCH="wasm"; & go build -o "bin/calyxium-lsp-js.wasm"

New-Item bin/wasip1 -Type Directory -Force | Out-Null
$Env:GOOS="wasip1";
$Env:GOARCH="wasm"; & go build -o "bin/wasip1/calyxium-lsp-wasip1.wasm"