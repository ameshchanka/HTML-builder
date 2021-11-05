const fs = require('fs/promises');
const path = require('path');

const folder = path.join(__dirname, 'secret-folder/');

(async function(folder) {
  try {
    let s = '';
    const files = await fs.readdir(folder, {withFileTypes: true});
    for (const file of files) {
      if(file.isFile()) {
        s = path.parse(folder + file.name).name + ' - ' 
          + path.extname(folder + file.name).substring(1) + ' - '
          + ((await fs.stat(folder + file.name)).size / 1024).toFixed(3) + ' KB';
        console.log(s);
      }
    }
  } catch (err) {
    console.error(err);
  }
})(folder);