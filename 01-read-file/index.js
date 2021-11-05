const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'text.txt');

let streame = fs.createReadStream(filePath);

streame.on('readable', function() {
    let data;

    while(data = streame.read()) {
        console.log(data.toString());
    }
})