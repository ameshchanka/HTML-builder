const fs = require('fs');
const fsp = require('fs/promises');

const folder = '05-merge-styles/';
const folderSrc = folder + 'styles';
const pathFile = folder + 'project-dist/bundle.css';

(async function() {
    let streameWrite = new fs.createWriteStream(pathFile, {flag: 'w', autoClose: false});
    try{
        await mergeFiles(folderSrc, streameWrite);
    }
    catch(err) {
        console.error(err);
    }
    finally{
        streameWrite?.close();
    }
})();

async function mergeFiles(dir, streameWrite) {
    try {
        let d;
        let files = await fsp.readdir(dir, {withFileTypes: true});
        for (let file of files) {
            d = dir + '/' + file.name;
            //console.log(d);
            if(file.isDirectory()) {
                await mergeFiles(d, streameWrite);
            } else if(file.isFile() && file.name.substring(file.name.length - 4) === '.css') {
                //console.log("isFile");
                await mergeFile(d, streameWrite);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

function mergeFile(fromFile, streameWrite) {
    return new Promise((resolve, reject) => {
        try {
            let streameRead = new fs.createReadStream(fromFile);
            streameRead.on('readable', write);
    
            function write() {
                let content = streameRead.read();
    
                if(content && !streameWrite.write(content)) {
                    
                    streameRead.removeListener('readable', write);
                    
                    streameWrite.once('drain', function() {
                        streameRead.on('readable', write);
                        write();
                    })
                }
            }
            streameRead.on('end', () => resolve());
        } catch (err) {
            console.error(err);
            reject();
        }
    })
}
