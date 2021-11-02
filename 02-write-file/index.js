const readline = require('readline');
const process = require('process');
const fs = require('fs');
const path = '02-write-file/text2.txt';
const rl = readline.createInterface({ 
    input: process.stdin,
    output: process.stdout 
});

console.log('Enter text: ');

rl.on('line', (line) => {
    if(line.trim() === 'exit') {
        rl.close();
    } else {
        fs.open(path, 'a', (err, fd) => {
            if (err) throw err;
            try {
                fs.appendFile(fd, line + '\n', 'utf8', (err) => {
                    closeFd(fd);
                    if (err) throw err;
                });
            } catch (err) {
                closeFd(fd);
                throw err;
            }
        });
        console.log('Enter text: ');
    }
});
rl.on('SIGINT', () => {
    rl.close();
});
rl.on('close', () => {
    rl.write('End programm! Goodbye!');
    process.exit(0);
  
});

function closeFd(fd) {
    fs.close(fd, (err) => {
      if (err) throw err;
    });
}
