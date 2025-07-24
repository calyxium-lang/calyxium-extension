@echo off
mkdir bin
cd vscode
vsce package -o ../bin/calyxium-lsp.vsix
cd ../