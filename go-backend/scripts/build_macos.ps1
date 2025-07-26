New-Item bin -Type Directory -Force | Out-Null

New-Item bin/darwin -Type Directory -Force | Out-Null
$Env:GOOS="darwin";
$Env:GOARCH="amd64"; & go build -o "bin/darwin/calyxium-lsp-mac-x64"
$Env:GOARCH="arm64"; & go build -o "bin/darwin/calyxium-lsp-mac-arm64"