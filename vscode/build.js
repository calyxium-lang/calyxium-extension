import * as fs from "fs"
import strip from 'strip-comments'

const fakeOut = () => {}
const buildDir = "build/"

const copyFile2 = async(file, rename) => {
    if (file.includes(".map")) return

    if (file.includes(".json")) {
        const thing = fs.readFileSync(file).toString()

        fs.writeFile(`${buildDir}${rename}`, JSON.stringify(JSON.parse(thing), null, 0), null, fakeOut)
    } else if (file.includes(".js")) {
        let thing = strip(fs.readFileSync(file).toString())

        fs.writeFile(`${buildDir}${rename}`, thing, null, fakeOut)
    } else {
        fs.copyFile(file, `${buildDir}${rename}`, fakeOut)
    }
}

const copyFile = (file) => copyFile2(file, file)
const copyDir = (dir) => {
    fs.readdir(dir, {
        recursive: true
    }, (err, files) => {
        files.forEach(file => {
            fs.mkdir(buildDir + dir, fakeOut)
            copyFile(dir + "/" + file)
        });
    })
}

fs.rm(buildDir, {
    recursive: true
}, () => {
    fs.mkdir(buildDir, {}, fakeOut)

    copyFile2("extmanifest.json", "package.json")
    copyFile("package-lock.json")
    copyFile("readme.md")
    copyFile("changelog.md")
    copyFile("LICENSE")
    copyDir("syntax-highlighting")
    copyDir("lib")
    copyDir("out")
    copyDir("imgs")
})