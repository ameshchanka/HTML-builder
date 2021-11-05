const fsp = require('fs/promises');
const path = require('path');

const folderSrc = path.join(__dirname, 'files');
const folderDest = path.join(__dirname, 'files_copy');

(async function() {
    await fsp.rmdir(folderDest, {recursive: true });
    await fsp.mkdir(folderDest, {recursive: true });
    await copyDir(folderSrc, folderDest);
})();

async function copyDir(dirSrc, dirDest) {
    try {
        let dirS, dirD;
        let files = await fsp.readdir(dirSrc, {withFileTypes: true});
        for (let file of files) {
            dirS = dirSrc + '/' + file.name;
            dirD = dirDest + '/' + file.name;
            console.log('copy  ' + file.name);
            if(file.isDirectory()) {
                console.log(' is DIR');
                await fsp.mkdir(dirD, {recursive: true })
                await copyDir(dirS, dirD);
            } else if(file.isFile()) {
                console.log(' is FILE');
                await fsp.copyFile(dirS, dirD);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

