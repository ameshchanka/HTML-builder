const fs = require('fs');

let streame = fs.createReadStream('01-read-file/text.txt');

streame.on('readable', function() {
    let data;

    while(data = streame.read()) {
        console.log(data.toString());
    }
})