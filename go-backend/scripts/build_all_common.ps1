New-Item bin -Type Directory -Force | Out-Null

New-Item bin/darwin -Type Directory -Force | Out-Null
$Env:GOOS="darwin";
$Env:GOARCH="amd64"; & go build -o "bin/darwin/calyxium-lsp-mac-x64"
$Env:GOARCH="arm64"; & go build -o "bin/darwin/calyxium-lsp-mac-arm64"

New-Item bin/linux -Type Directory -Force | Out-Null
$Env:GOOS="linux";
$Env:GOARCH="386"; & go build -o "bin/linux/calyxium-lsp-linux-x86"
$Env:GOARCH="amd64"; & go build -o "bin/linux/calyxium-lsp-linux-x64"
$Env:GOARCH="arm"; & go build -o "bin/linux/calyxium-lsp-linux-arm"
$Env:GOARCH="arm64"; & go build -o "bin/linux/calyxium-lsp-linux-arm64"

New-Item bin/windows -Type Directory -Force | Out-Null
$Env:GOOS="windows";
$Env:GOARCH="386"; & go build -o "bin/windows/calyxium-lsp-win-x86.exe"
$Env:GOARCH="amd64"; & go build -o "bin/windows/calyxium-lsp-win-x64.exe"
$Env:GOARCH="arm"; & go build -o "bin/windows/calyxium-lsp-win-arm.exe"
$Env:GOARCH="arm64"; & go build -o "bin/windows/calyxium-lsp-win-arm64.exe"