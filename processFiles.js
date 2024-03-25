const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');
var pngitxt = require('png-itxt');

// Komut satırı argümanlarından gelen değerleri al
const [sourceDir, searchText, targetDir, secondarySearchTexts, subTargetDirs] = process.argv.slice(2);

// Birden fazla ikincil arama ve hedef klasörü işlemek üzere diziye dönüştür
const secondarySearchTextArray = secondarySearchTexts ? secondarySearchTexts.split('|') : [];
const subTargetDirsArray = subTargetDirs ? subTargetDirs.split('|') : [];

const primaryRegex = new RegExp(searchText, "i");

console.log('processFiles.js is running...');

// Dosya adı çakışmalarını yönetmek için yardımcı fonksiyon
async function generateNewFileName(originalPath, targetPath) {
  let baseName = path.basename(originalPath, path.extname(originalPath));
  let extension = path.extname(originalPath);
  let counter = 1;
  let newPath = targetPath;

  while (await fs.promises.access(newPath).then(() => true).catch(() => false)) {
    // Eğer dosya adında '-renamed-' ifadesi varsa ve sonunda sayı bulunuyorsa, sayıyı artır
    let match = baseName.match(/(.*-renamed-)(\d+)$/);
    if (match) {
      baseName = match[1] + (parseInt(match[2], 10) + 1);
    } else {
      baseName = `${baseName}-renamed-${counter}`;
    }
    newPath = path.join(path.dirname(targetPath), `${baseName}${extension}`);
    counter++;
  }
  return newPath;
}

// Asenkron dosya işleme fonksiyonu
async function processFile(filePath) {
  return new Promise((resolve, reject) => {
    let metaDataFound = false;
    let secondaryIndex = -1; // Bulunan ikincil metin için index
    fs.createReadStream(filePath)
      .pipe(pngitxt.get(async (err, data) => {
        if (err || !data) {
          console.log('Error or no data in ' + filePath);
          return resolve({ found: false });
        }

        const mdString = JSON.stringify(data);

        // Birincil ve ikincil metin kontrolü
        if (mdString.match(primaryRegex)) {
          metaDataFound = true;
          secondarySearchTextArray.forEach((text, index) => {
            if (mdString.match(new RegExp(text, "i"))) {
              secondaryIndex = index;
            }
          });
        }
        
        resolve({ found: metaDataFound, secondaryIndex });
      }));
  });
}

// Asenkron klasör işleme fonksiyonu
async function processDirectory(directory) {
  const files = await fs.promises.readdir(directory);
  let totalMoved = 0;
  let totalErrors = 0;
  let movedFilesPaths = [];
  
  for (let file of files) {
    const filePath = path.join(directory, file);
    const fileExt = path.extname(filePath).toLowerCase();
    if (fileExt === '.png') {
      try {
        const { found, secondaryIndex } = await processFile(filePath);
        if (found) {
          let targetPath;
          if (secondaryIndex >= 0) {
            // İkincil arama metni bulunursa, dosyayı ilgili alt klasöre taşı
            targetPath = path.join(targetDir, subTargetDirsArray[secondaryIndex], path.basename(filePath));
          } else {
            // Yalnızca birincil arama metni bulunursa, dosyayı birincil hedef klasöre taşı
            targetPath = path.join(targetDir, path.basename(filePath));
          }

          // Dosya adı çakışması kontrolü ve yeni dosya adı üretimi
          targetPath = await generateNewFileName(filePath, targetPath);

          await fsExtra.move(filePath, targetPath);
          console.log(`File moved to: ${targetPath}`);
          totalMoved++;
          movedFilesPaths.push(targetPath);
        }
      } catch (error) {
        console.error(`An error occurred while processing ${filePath}:`, error);
        totalErrors++;
      }
    }
  }

  // İşlem sonuçlarını göster
  console.log(`SEND: {"totalMoved":${totalMoved}, "totalErrors":${totalErrors}, "movedFilesPaths":${JSON.stringify(movedFilesPaths)}}`);
}

// Klasör işleme işlevini başlat
processDirectory(sourceDir).catch(error => {
  console.error('An error occurred:', error);
});
