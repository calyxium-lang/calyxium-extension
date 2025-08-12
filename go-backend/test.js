const rgx = /-#(((hi)|\s))*#-/gm

let match;

while ((match = rgx.exec(`-# hi hi #-`)) != null) {
    console.log(match)
}