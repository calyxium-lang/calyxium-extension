function doCodeLense(envMap, source) {
    if (envMap == null) return []
    source = source.replaceAll("\r", "")
    const lines = source.split('\n')
    let lenseEnv = []

    const regx = /let (rec )*[A-Za-z0-9_,\s]+\s*(\(|:|=)/gm
    for (let index = 0; index < lines.length; index++) {
        const element = lines[index];
        // const element = lines[index] as String;
        if (element.startsWith("--") || element.trim() == "") continue
        const offset = element.length - element.trimStart().length
        let exec;
        while ((exec = regx.exec(element)) != null) {
            let funcName = element.trim().replaceAll(/let (rec )*/gm, "").replaceAll(/\(.*\).*/gm, "").replaceAll(/:.*/gm, "").replaceAll(/=.*/gm, "").trim()
            if (envMap[funcName] != null) {
                lenseEnv.push({
                    "line": index,
                    "charStart": offset,
                    "charEnd": element.length - 1,

                    "name": envMap[funcName].replaceAll(/.*:/gm, "").trim()
                })
            }            
        }
    }

    return lenseEnv
}

function linkComments(source) {
    source = source.replaceAll("\r", "")
    const envMap = {}

    const regx = /-- \$.*\$\nlet (rec )*[A-Za-z0-9_,\s]+\s*(\(|:|=)/gm
    
    let match;
    while ((match = regx.exec(source)) != null) {
        const comment = match[0].replaceAll("-- $", "").replaceAll(/\$\nlet (rec )*[A-Za-z0-9_,\s]+\s*(\(|:|=)/gm, "")
        const funcName = match[0].replaceAll(/-- \$.*\$\n/gm, "").replaceAll(/let (rec )*/gm, "").replaceAll("\(", "").replaceAll(":", "").replaceAll("=", "").trim()

        if (funcName.includes(",")) {
            funcName.replaceAll(" ", "").split(",").forEach(na => {
                envMap[na] = comment.replaceAll("\\n", "\n")
            })
        } else {
            envMap[funcName] = comment.replaceAll("\\n", "\n")
        }

    }

    envMap["-source"] = source.replaceAll(/(-- \$.*\$|-- (.+\n))/gm, "")

    return envMap
}

function handleDocument(text) {
    const output = text
    let jzon = JSON.parse(output)

    const objs = []

    let thing = Object.keys(jzon)
    while ((thing = Object.keys(jzon)).includes("body")) {
        jzon = jzon.body

        if (jzon instanceof Array) {
            for (const element of jzon) {
                objs.push(element)
            }
        }
    }

    for (let index = 0; index < objs.length; index++) {
        const obj = objs[index];
        
        if (obj instanceof Array) {
            for (const element of obj) {
                objs.push(element)
            }
        }
        if (Object.keys(obj).includes("body")) {
            if (obj.body instanceof Array) {
                for (const element of obj.body) {
                    objs.push(element)
                }
            } else {
                for (const element of obj.body.body) {
                    objs.push(element)
                }
            }

        }
        if (Object.keys(obj).includes("type") && obj.type == "ExprStmt") {
            objs.push(obj.expression)
        }
    }

    function handleType(type) {
        switch (type.type) {
                case "Infer":
                    return "'a"
                case "SymbolType":
                    return type.value
                case "ArrayType":
                    return "[]" + handleType(type.element_type)
                case "TupleType":
                    let v = ""
                    for (let i = 0; i < type.elements.length; i++) {
                        const element = type.elements[i];
                        v += handleType(element)
                        if ((type.elements.length - 1) != i) {
                            v += ", "
                        }
                    }
                    return "(" + v + ")"
            
                default:
                    break;
        }
    }

    const envMap = {}

    objs.forEach(f => {
        if (Object.keys(f).includes("type") && f.type == "FunctionDeclStmt") {
            let name = "let " + (f.is_rec ? "rec " : "") + f.name + ":"

            for (let i = 0; i < f.parameters.length; i++) {
                const element = f.parameters[i].param_type;
                name += (i == 0 ? " " : " -> ") + handleType(element)
            }
            name += " -> " + handleType(f.return_type)
            envMap[f.name] = name
        }
        if (Object.keys(f).includes("type") && f.type == "VarDeclarationExpr") {
            envMap[f.identifier] = handleType(f.explicit_type)
        }
        if (Object.keys(f).includes("type") && f.type == "MultiVarDeclarationExpr") {
            for (let i = 0; i < f.identifier.length; i++) {
                const name = f.identifier[i];
                let type = f.explicit_type;
                if (f.explicit_type.type == "TupleType") type = f.explicit_type.elements[i];
                envMap[name] = handleType(type)
            }
        }
    })

    return envMap
}
