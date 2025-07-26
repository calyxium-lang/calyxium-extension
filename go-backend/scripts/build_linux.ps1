New-Item bin -Type Directory -Force | Out-Null

New-Item bin/linux -Type Directory -Force | Out-Null
$Env:GOOS="linux";
$Env:GOARCH="386"; & go build -o "bin/linux/calyxium-lsp-linux-x86"
$Env:GOARCH="amd64"; & go build -o "bin/linux/calyxium-lsp-linux-x64"
$Env:GOARCH="arm"; & go build -o "bin/linux/calyxium-lsp-linux-arm"
$Env:GOARCH="arm64"; & go build -o "bin/linux/calyxium-lsp-linux-arm64"
$Env:GOARCH="loong64"; & go build -o "bin/linux/calyxium-lsp-linux-loong64"
$Env:GOARCH="mips"; & go build -o "bin/linux/calyxium-lsp-linux-mips"
$Env:GOARCH="mipsle"; & go build -o "bin/linux/calyxium-lsp-linux-mipsle"
$Env:GOARCH="mips64"; & go build -o "bin/linux/calyxium-lsp-linux-mips64"
$Env:GOARCH="mips64le"; & go build -o "bin/linux/calyxium-lsp-linux-mips64le"
$Env:GOARCH="ppc64"; & go build -o "bin/linux/calyxium-lsp-linux-ppc64"
$Env:GOARCH="ppc64le"; & go build -o "bin/linux/calyxium-lsp-linux-ppc64le"
$Env:GOARCH="riscv64"; & go build -o "bin/linux/calyxium-lsp-linux-riscv64"
$Env:GOARCH="s390x"; & go build -o "bin/linux/calyxium-lsp-linux-s390x"