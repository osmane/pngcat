const fs = require('fs')
const path = require('path')
const fsExtra = require('fs-extra')
// const exiftool = require('node-exiftool');
// const ep = new exiftool.ExiftoolProcess();

const exiftool = require('node-exiftool')
const exiftoolBin = require('dist-exiftool')
const ep = new exiftool.ExiftoolProcess(exiftoolBin)

// Komut satırı argümanlarından gelen değerleri al
const [sourceDir, searchText, targetDir, secondarySearchTexts, subTargetDirs] = process.argv.slice(2)

// Birden fazla ikincil arama ve hedef klasörü işlemek üzere diziye dönüştür
const secondarySearchTextArray = secondarySearchTexts ? secondarySearchTexts.split('|') : []
const subTargetDirsArray = subTargetDirs ? subTargetDirs.split('|') : []

const primaryRegex = new RegExp(searchText, 'i')

console.log('processFiles.js is running...')

// Dosya adı çakışmalarını yönetmek için yardımcı fonksiyon
async function generateNewFileName (originalPath, targetPath) {
  let baseName = path.basename(originalPath, path.extname(originalPath))
  const extension = path.extname(originalPath)
  let counter = 1
  let newPath = targetPath

  while (await fs.promises.access(newPath).then(() => true).catch(() => false)) {
    // Eğer dosya adında '-renamed-' ifadesi varsa ve sonunda sayı bulunuyorsa, sayıyı artır
    const match = baseName.match(/(.*-renamed-)(\d+)$/)
    if (match) {
      baseName = match[1] + (parseInt(match[2], 10) + 1)
    } else {
      baseName = `${baseName}-renamed-${counter}`
    }
    newPath = path.join(path.dirname(targetPath), `${baseName}${extension}`)
    counter++
  }
  return newPath
}

// Asenkron dosya işleme fonksiyonu
async function processFile (filePath) {
  try {
    console.log('processFile started...')

    // PNG dosyasından meta verileri oku   
    
    const result = await ep.readMetadata(filePath, ['-File:all']) // -j json formatında çıktı almak için
    //console.log('readMetadata result t1:', result.toString())

    const metadata = result.data[0] // İlk dosya için meta veriler
    let metaDataFound = false
    let secondaryIndex = -1
    let currentKeywords =''
    // Dosya metadatası içinden metinleri bul ve kontrol et
    if (metadata) {
      // Meta verileri string'e çevir

      const mdString = JSON.stringify(metadata)
      //console.log(metadata.parameters )

      // Birincil ve ikincil metin kontrolü 
      if (metadata.parameters && metadata.parameters.match(primaryRegex)) { 
        metaDataFound = true
        secondarySearchTextArray.forEach((text, index) => {
          if (mdString.match(new RegExp(text, 'i'))) {
            secondaryIndex = index                     
          }
        })        
      }
      if (metadata.Keywords) {
        currentKeywords = metadata.Keywords
        console.log(`processFile, Current Keywords: ${JSON.stringify(currentKeywords)}`)
      }else{
        console.log(`processFile, Current Keywords: null`)              
      }     
    }

    return { found: metaDataFound, secondaryIndex, currentKeywords: currentKeywords }
  } catch (error) {
    console.error(`Error: ${error}`)
    return { found: false }
  }
}

// Asenkron klasör işleme fonksiyonu
async function processDirectory (directory) {
  const files = await fs.promises.readdir(directory)
  let totalMoved = 0
  let totalErrors = 0
  const movedFilesPaths = []
  console.log('processDirectory started...')
  await ep.open()
  for (const file of files) {
    const filePath = path.join(directory, file)
    const fileExt = path.extname(filePath).toLowerCase()
    if (fileExt === '.png') {
      try {
        const { found, secondaryIndex } = await processFile(filePath)
        if (found) {
          let targetPath
          if (secondaryIndex >= 0) {
            // İkincil arama metni bulunursa, dosyayı ilgili alt klasöre taşı
            targetPath = path.join(targetDir, subTargetDirsArray[secondaryIndex], path.basename(filePath))
          } else {
            // Yalnızca birincil arama metni bulunursa, dosyayı birincil hedef klasöre taşı
            targetPath = path.join(targetDir, path.basename(filePath))
          }

          // Dosya adı çakışması kontrolü ve yeni dosya adı üretimi
          targetPath = await generateNewFileName(filePath, targetPath)

          await fsExtra.move(filePath, targetPath)

            await ep.writeMetadata(targetPath, {
            //all: '', // remove existing tags
            comment: 'Exiftool rules!',
            'Keywords+': [ 'keywordA', 'keywordB' ],
            }, ['overwrite_original'])
            .then(console.log)
            .catch(console.error);

          console.log(`File moved to: ${targetPath}`);
          totalMoved++;
          movedFilesPaths.push(targetPath);
        }
      } catch (error) {
        console.error(`An error occurred while processing ${filePath}:`, error)
        totalErrors++
      }
    }
  }
  await ep.close()
  // İşlem sonuçlarını göster
  console.log(`SEND: {"totalMoved":${totalMoved}, "totalErrors":${totalErrors}, "movedFilesPaths":${JSON.stringify(movedFilesPaths)}}`)
}

// easy division function here

// Klasör işleme işlevini başlat
processDirectory(sourceDir).catch(error => {
  console.error('An error occurred:', error)
})
