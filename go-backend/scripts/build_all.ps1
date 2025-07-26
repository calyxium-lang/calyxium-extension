New-Item bin -Type Directory -Force | Out-Null
$Env:CC="gcc"

New-Item bin/aix -Type Directory -Force | Out-Null
$Env:GOOS="aix";
$Env:GOARCH="ppc64"; & go build -o "bin/aix/calyxium-lsp-aix-ppc64"

New-Item bin/android -Type Directory -Force | Out-Null
$Env:CGO_CFLAGS="--sysroot=$Env:ANDROID_NDK_ROOT\29.0.13599879\toolchains\llvm\prebuilt\windows-x86_64\sysroot"
$Env:GOOS="android";
$Env:CGO_ENABLED=1;
$Env:CC="$Env:ANDROID_NDK_ROOT\29.0.13599879\toolchains\llvm\prebuilt\windows-x86_64\bin\i686-linux-android30-clang"
$Env:GOARCH="386"; & go build -o "bin/android/calyxium-lsp-android-x86"
$Env:CC="$Env:ANDROID_NDK_ROOT\29.0.13599879\toolchains\llvm\prebuilt\windows-x86_64\bin\x86_64-linux-android30-clang"
$Env:GOARCH="amd64"; & go build -o "bin/android/calyxium-lsp-android-x64"
$Env:CC="$Env:ANDROID_NDK_ROOT\29.0.13599879\toolchains\llvm\prebuilt\windows-x86_64\bin\armv7a-linux-androideabi30-clang"
$Env:GOARCH="arm"; & go build -o "bin/android/calyxium-lsp-android-arm"
$Env:CC="$Env:ANDROID_NDK_ROOT\29.0.13599879\toolchains\llvm\prebuilt\windows-x86_64\bin\aarch64-linux-android30-clang"
$Env:GOARCH="arm64"; & go build -o "bin/android/calyxium-lsp-android-arm64"
$Env:CGO_ENABLED=0;
$Env:CGO_CFLAGS=""
$Env:CC=""

New-Item bin/darwin -Type Directory -Force | Out-Null
$Env:GOOS="darwin";
$Env:GOARCH="amd64"; & go build -o "bin/darwin/calyxium-lsp-mac-x64"
$Env:GOARCH="arm64"; & go build -o "bin/darwin/calyxium-lsp-mac-arm64"

New-Item bin/dragonfly -Type Directory -Force | Out-Null
$Env:GOOS="dragonfly";
$Env:GOARCH="amd64"; & go build -o "bin/dragonfly/calyxium-lsp-dragonfly-x64"

New-Item bin/freebsd -Type Directory -Force | Out-Null
$Env:GOOS="freebsd";
$Env:GOARCH="386"; & go build -o "bin/freebsd/calyxium-lsp-freebsd-x86"
$Env:GOARCH="amd64"; & go build -o "bin/freebsd/calyxium-lsp-freebsd-x64"
$Env:GOARCH="arm"; & go build -o "bin/freebsd/calyxium-lsp-freebsd-arm"
$Env:GOARCH="arm64"; & go build -o "bin/freebsd/calyxium-lsp-freebsd-arm64"
$Env:GOARCH="arm64"; & go build -o "bin/freebsd/calyxium-lsp-freebsd-riscv64"

New-Item bin/illumos -Type Directory -Force | Out-Null
$Env:GOOS="illumos";
$Env:GOARCH="amd64"; & go build -o "bin/illumos/calyxium-lsp-illumos-x64"

# This requires something I dont have (the IOS SDK)
#New-Item bin/ios -Type Directory -Force | Out-Null
# $Env:CGO_CFLAGS=""
# $Env:CC="clang"
# $Env:GOOS="ios";
# $Env:CGO_ENABLED=1;
# $Env:GOARCH="amd64"; & go build -o "bin/ios/calyxium-lsp-ios-x64"
# $Env:GOARCH="arm64"; & go build -o "bin/ios/calyxium-lsp-ios-arm64"
# $Env:CGO_ENABLED=0;

New-Item bin/js -Type Directory -Force | Out-Null
$Env:GOOS="js";
$Env:GOARCH="wasm"; & go build -ldflags "-X main.isWASM=true" -o "bin/js/calyxium-lsp-js.wasm"

New-Item bin/linux -Type Directory -Force | Out-Null
$Env:GOOS="linux";
$Env:GOARCH="386"; & go build -o "bin/linux/calyxium-lsp-linux-x86"
$Env:GOARCH="amd64"; & go build -o "bin/linux/calyxium-lsp-linux-x64"
$Env:GOARCH="arm"; & go build -o "binlinux/calyxium-lsp-linux-arm"
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

New-Item bin/netbsd -Type Directory -Force | Out-Null
$Env:GOOS="netbsd";
$Env:GOARCH="386"; & go build -o "bin/netbsd/calyxium-lsp-netbsd-x86"
$Env:GOARCH="amd64"; & go build -o "bin/netbsd/calyxium-lsp-netbsd-x64"
$Env:GOARCH="arm"; & go build -o "bin/netbsd/calyxium-lsp-netbsd-arm"
$Env:GOARCH="arm64"; & go build -o "bin/netbsd/calyxium-lsp-netbsd-arm64"

New-Item bin/openbsd -Type Directory -Force | Out-Null
$Env:GOOS="openbsd";
$Env:GOARCH="386"; & go build -o "bin/openbsd/calyxium-lsp-openbsd-x86"
$Env:GOARCH="amd64"; & go build -o "bin/openbsd/calyxium-lsp-openbsd-x64"
$Env:GOARCH="arm"; & go build -o "bin/openbsd/calyxium-lsp-openbsd-arm"
$Env:GOARCH="arm64"; & go build -o "bin/openbsd/calyxium-lsp-openbsd-arm64"

New-Item bin/plan9 -Type Directory -Force | Out-Null
$Env:GOOS="plan9";
$Env:GOARCH="386"; & go build -o "bin/plan9/calyxium-lsp-plan9-x86"
$Env:GOARCH="amd64"; & go build -o "bin/plan9/calyxium-lsp-plan9-x64"
$Env:GOARCH="arm"; & go build -o "bin/plan9/calyxium-lsp-plan9-arm"

New-Item bin/solaris -Type Directory -Force | Out-Null
$Env:GOOS="solaris";
$Env:GOARCH="amd64"; & go build -o "bin/solaris/calyxium-lsp-solaris-x64"

New-Item bin/wasip1 -Type Directory -Force | Out-Null
$Env:GOOS="wasip1";
$Env:GOARCH="wasm"; & go build -ldflags "-X main.isWASM=true" -o "bin/wasip1/calyxium-lsp-wasip1.wasm"

New-Item bin/windows -Type Directory -Force | Out-Null
$Env:GOOS="windows";
$Env:GOARCH="386"; & go build -o "bin/windows/calyxium-lsp-win-x86.exe"
$Env:GOARCH="amd64"; & go build -o "bin/windows/calyxium-lsp-win-x64.exe"
$Env:GOARCH="arm"; & go build -o "bin/windows/calyxium-lsp-win-arm.exe"
$Env:GOARCH="arm64"; & go build -o "bin/windows/calyxium-lsp-win-arm64.exe"