New-Item bin -Type Directory -Force | Out-Null

New-Item bin/windows -Type Directory -Force | Out-Null
$Env:GOOS="windows";
$Env:GOARCH="386"; & go build -o "bin/windows/calyxium-lsp-win-x86.exe"
$Env:GOARCH="amd64"; & go build -o "bin/windows/calyxium-lsp-win-x64.exe"
$Env:GOARCH="arm"; & go build -o "bin/windows/calyxium-lsp-win-arm.exe"
$Env:GOARCH="arm64"; & go build -o "bin/windows/calyxium-lsp-win-arm64.exe"