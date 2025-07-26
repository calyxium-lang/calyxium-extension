New-Item bin -Type Directory -Force | Out-Null
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