const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const option = {
    folderCSS: path.join(__dirname, 'styles'),
    folderAssets: path.join(__dirname, 'assets'),
    folderComponents: path.join(__dirname, 'components'),
    folderOut: path.join(__dirname, 'project-dist'),
    folderAssetsOut: path.join(__dirname, 'project-dist', 'assets'),
    htmlFileOut: path.join(__dirname, 'project-dist', 'index.html'),
    cssFileOut: path.join(__dirname, 'project-dist', 'style.css'),
    templateFile: path.join(__dirname, 'template.html')
}

async function buildPage(opt) {
    try{
        let d;
        console.log('dir will be create');
        d = await createOutputDir(opt.folderOut);
        if(d) {
            console.log(`dir "${d}" is created`);
            console.log('merge css file start');
            await mergeStyles(opt.folderCSS, opt.cssFileOut);
            console.log('merge css file end');
            console.log('copy assets start');
            await copyAssets(opt.folderAssets, opt.folderAssetsOut);
            console.log('copy assets end');
            console.log('build index.html start');
            await buildFile(opt.templateFile, opt.folderComponents, opt.htmlFileOut);
            console.log('build index.html end');
        }
    }
    catch(err) {
        console.error(err);
    }
};

buildPage(option);

async function createOutputDir(dir) {
    return new Promise((resolve, reject) => {
        try {
            fs.rm(dir, {force: true, recursive: true }, ()=> {
                fs.mkdir(dir, {recursive: true }, ()=>{
                    resolve(dir);
                });
            });
        } catch (err) {
            console.error(err);
            reject();
        }
    })
}

async function mergeStyles(dirStyle, fileOut) {
    
    let sw;
    try{
        sw = fs.createWriteStream(fileOut, {flag: 'w', autoClose: false});
        
        async function mergeFiles(dir, streameWrite) {
            try {
                let d;
                let files = await fsp.readdir(dir, {withFileTypes: true});
                for (let file of files) {
                    d = dir + '/' + file.name;
                    console.log(d);
                    if(file.isDirectory()) {
                        await mergeFiles(d, streameWrite);
                    } else if(file.isFile() && file.name.substring(file.name.length - 4) === '.css') {
                        console.log("isFile");
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
        await mergeFiles(dirStyle, sw);
    }
    catch(err) {
        console.error(err);
    }
    finally{
        sw?.close();
    }
}

async function copyAssets(fromDir, toDir) {
    await fsp.rm(toDir, {force: true, recursive: true });
    await fsp.mkdir(toDir, {recursive: true });
    await copyDir(fromDir, toDir);

    async function copyDir(dirSrc, dirDest) {
        try {
            let dirS, dirD;
            let files = await fsp.readdir(dirSrc, {withFileTypes: true});
            for (let file of files) {
                
                dirS = dirSrc + '/' + file.name;
                dirD = dirDest + '/' + file.name;
                if(file.isDirectory()) {
                    await fsp.mkdir(dirD, {recursive: true })
                    await copyDir(dirS, dirD);
                } else if(file.isFile()) {
                    await fsp.copyFile(dirS, dirD);
                    console.log(`copy  ${dirS}  to  ${dirDest}`);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
}

async function buildFile(templateFile, componentsDir, htmlFileOut) {
    
    let outFile, tf, data, components;
    let isRead = true;
    let length = 0;
    let offset = 0;
    let position = 0;
    let bufferLength = 0;
    let strTag = '';
    let isTag = false;
    
    try{

        tf = await fsp.open(templateFile);
        outFile = await fsp.open(htmlFileOut, 'w');
        components = await fsp.readdir(componentsDir, {withFileTypes: true});

        while(isRead) {
            data = await tf.read();
            if(data.bytesRead < data.buffer.length) {
                isRead = false;
            }
            for(let i = 1; i <= data.bytesRead; i++) {
                if(!isTag) {
                    // 0{{header}}...B.L, 0..{{header}}...B.L
                    if(data.buffer[i - 1] === 123 && i < data.bytesRead && data.buffer[i] === 123) {
                        length = i - 1;
                        //принимаем тэг
                        isTag = true;
                        //пишем часть в файл
                        if(length) {
                            await outFile.write(data.buffer, offset, length - offset, position);
                            position += length - offset;
                        }
                    } // 0...{B.L..
                    else if(data.buffer[i - 1] === 123 && i === data.bytesRead) {
                        bufferLength = i - 1;
                        length = data.bytesRead - 1;
                    } // 0...{B.L...{{header}}..- дописываем в файл '{' так как она не являеься тэгом
                    else if(bufferLength && i - 1 === 0 && data.buffer[i - 1] !== 123) {
                        await outFile.write('{', position);
                        position += 1;
                    } // 0...{B.L{header}}.. - последняя ковыка всё же была открывающим тэгом 
                    else if(bufferLength && i - 1 === 0 && data.buffer[i - 1] === 123) {
                        isTag = true;
                    }
                    // 0.....B.L, 0...{B.L.., }}...B.L - дописываем в файл
                    if(i === data.bytesRead) { 
                        length = (length === 0 || length < offset) ? data.bytesRead : length;
                        await outFile.write(data.buffer, offset, length - offset, position);
                        position += length - offset;
                        length = 0;
                        offset = 0;
                    }
                } else {
                    if(data.buffer[i - 1] !== 123) strTag += String.fromCharCode(data.buffer[i - 1]);
                    
                    if(data.buffer[i - 1] === 125) {
                        // тэг конец
                        isTag = false
                        offset = (i + 1) % data.buffer.length;
                        i++;
                        strTag = strTag.substring(0, strTag.length - 1);

                        // считать файл компонента и запсать его
                        for (const component of components) {
                            if(component.isFile()) {
                                let fileName = path.parse(componentsDir + '/' + component.name).name;
                                if(fileName === strTag) {
                                    try {
                                        cf = await fsp.open(componentsDir + '/' + component.name);
                                        let dataComponent;
                                        let isComponentRead = true;
                                        while(isComponentRead) {
                                            dataComponent = await cf.read();
                                            if(dataComponent.bytesRead < dataComponent.buffer.length) {
                                                isComponentRead = false;
                                            }
                                            console.log('add content from file - ' + fileName);
                                            await outFile.write(dataComponent.buffer, 0, dataComponent.bytesRead, position);
                                            position += dataComponent.bytesRead;
                                        }
                                    }
                                    catch(err) {
                                        console.error(err);
                                    }
                                    finally{
                                        await cf?.close();
                                    }
                                }
                            }
                        }
                        strTag = '';
                    }
                }
            }
        }
    }
    catch(err) {
        console.error(err);
    }
    finally{
        await tf?.close();
        await outFile?.close();
    }
}

