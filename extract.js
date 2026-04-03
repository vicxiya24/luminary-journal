const fs = require('fs');
const pdf = require('pdf-parse');
let dataBuffer = fs.readFileSync('Luminary_Journal_SOP.pdf');
pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('sop.txt', data.text);
});
