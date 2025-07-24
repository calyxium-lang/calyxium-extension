New-Item bin -Type Directory -Force | Out-Null
vsce package -o "bin/calyxium-lsp.vsix" -C vscode