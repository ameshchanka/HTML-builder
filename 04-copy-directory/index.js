const fs = require('fs');
const fsp = require('fs/promises');

const folder = '04-copy-directory/';
const folderSrc = folder + 'files';
const folderDest = folder + 'files_copy';

(function() {
    fs.rmdir(folderDest, {recursive: true }, ()=> {
        fs.mkdir(folderDest, {recursive: true }, ()=>{
            copyDir(folderSrc, folderDest);
        });
    });
})();

async function copyDir(dirSrc, dirDest) {
    try {
        let dirS, dirD;
        let files = await fsp.readdir(dirSrc, {withFileTypes: true});
        for (let file of files) {
            
            dirS = dirSrc + '/' + file.name;
            dirD = dirDest + '/' + file.name;
            if(file.isDirectory()) {
                await fsp.mkdir(dirD, {recursive: true })
                copyDir(dirS, dirD);
            } else if(file.isFile()) {
                await fsp.copyFile(dirS, dirD);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

