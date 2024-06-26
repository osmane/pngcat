const fs = require('fs')
const path = require('path')
const fsExtra = require('fs-extra')
const exiftool = require('node-exiftool')
const exiftoolBin = require('dist-exiftool')
const ep = new exiftool.ExiftoolProcess(exiftoolBin)

// Get values from command line arguments
const [sourceDir, searchText, targetDir, secondarySearchTexts, subTargetDirs, primaryCustomTags, secondaryCustomTags, checkpointChecked, loraChecked] = process.argv.slice(2)

// Convert multiple secondary search texts and target directories into arrays
const secondarySearchTextArray = secondarySearchTexts ? secondarySearchTexts.split('|') : []
const subTargetDirsArray = subTargetDirs ? subTargetDirs.split('|') : []
const secondaryCustomTagsArray = secondaryCustomTags ? stringToTagstring(secondaryCustomTags).split('|') : []

const primaryRegex = new RegExp(searchText, 'i')
const loraRegex = /Lora hashes: \\"([^"]+)\\"/

const primaryCustomTagsArray = primaryCustomTags ? stringToTagstring(primaryCustomTags).split(',') : []

console.log(`processFiles.js is running... ${primaryCustomTags} arraying to ${primaryCustomTagsArray.join(',')}`)

// Helper function to manage filename conflicts
async function generateNewFileName (originalPath, targetPath) {
  let baseName = path.basename(originalPath, path.extname(originalPath))
  const extension = path.extname(originalPath)
  let counter = 1
  let newPath = targetPath

  while (await fs.promises.access(newPath).then(() => true).catch(() => false)) {
    // If the filename contains '-renamed-' and ends with a number, increment the number
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

// Async file processing function
async function processFile (filePath) {
  try {
    console.log('processFile started...')
    var secondaryKeywords = []
    const sysTags = []
    // Read metadata from a PNG file

    const result = await ep.readMetadata(filePath, ['-File:all']) // -j for json format output
    // console.log('readMetadata result t1:', result.toString())

    const metadata = result.data[0] // Metadata for the first file
    let primaryFound = false
    let secondaryIndex = -1
    let currentKeywords = ''
    // Search and check texts within file metadata
    if (metadata) {
      // Convert metadata to string

      const mdString = JSON.stringify(metadata)      
      const positiveRegex = new RegExp(/^([\s\S]*?)\s*Negative prompt:/, 'i')
      const positivePromt = metadata.parameters.match(positiveRegex)[0]
      // console.log(positivePromt )

      // Primary and secondary text checks
      if (positivePromt && positivePromt.match(primaryRegex)) {
        primaryFound = true
        console.log('Primary text found: ' + searchText)
        secondarySearchTextArray.forEach((text, index) => {
          if (positivePromt.match(new RegExp(text, 'i'))) {
            secondaryIndex = index
            secondaryKeywords = secondaryKeywords.concat(secondaryCustomTagsArray[index].split(','))
            console.log(`Secondary text found: ${text}`)
          }else{
            console.log(`Secondary text not found: ${text}`)
          }
        })

        if (checkpointChecked) {
          sysTags.push('Checkpoint_' + (mdString.match(/, Model: ([\w\d]+),/)?.[1] || null))
        }

        if (loraChecked) {
          const match = mdString.match(loraRegex)
          if (match) {
            sysTags.push(...match[1].split(', ').map(hash => 'Lora_' + hash.split(': ')[0]))
          }
        }
      }else{
        console.log('Warning! Primary text not found: ' + searchText + ' in ' + filePath + ' positivePromt: ' + positivePromt)
      }

      const mdJson = JSON.parse(mdString)
      if ((mdJson.Keywords) || (mdJson.keywords) || mdJson['Keywords'] ) {
        currentKeywords = mdJson.Keywords || mdJson.keywords || mdJson['Keywords']
        console.log(`processFile, Current Keywords t1: ${JSON.stringify(currentKeywords)}`)
      } else {
        //console.log('processFile, Current Keywords: ' + mdJson)
      }
      //console.log(`processFile, Current mdjson: ${JSON.stringify(mdJson)}`)
    }

    return { found: primaryFound, secondaryIndex, currentKeywords: currentKeywords, secondaryKeywords: secondaryKeywords, sysTags: sysTags }
  } catch (error) {
    console.error(`Error: ${error}`)
    return { found: false }
  }
}

function stringToTagstring (text) {
  //return text.replace(/[^\p{L}\p{N}, ]/gu, '_');
    return text.replace(/[^\p{L}\p{N}, |]/gu, '_');
}

function uniqueTitleCaseArray(array) {  
  const uniqueArray = [...new Set(array.map(element => element.toLowerCase()))];
  const resultArray = uniqueArray.map(element => {
    return element
      .split(' ')  
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))  
      .join(' '); 
  });

  return resultArray;
}

// Async directory processing function
async function processDirectory (directory) {
  const files = await fs.promises.readdir(directory)
  let totalProcessed = 0
  let totalErrors = 0
  let totalUpdated = 0
  const movedFilesPaths = []
  console.log('processDirectory started...')
  await ep.open()
  for (const file of files) {
    const filePath = path.join(directory, file)
    const fileExt = path.extname(filePath).toLowerCase()
    let customTags = []
    if (fileExt === '.png') {
      try {
        const { found, secondaryIndex, currentKeywords, secondaryKeywords, sysTags } = await processFile(filePath)
        if (found) {
          let targetPath
          customTags = customTags.concat(primaryCustomTagsArray).concat(currentKeywords).concat(sysTags).concat(secondaryKeywords)

          if ((secondaryIndex >= 0) && (!!subTargetDirsArray[secondaryIndex] )){
            // If a secondary search text is found, move the file to the corresponding sub-directory
            if (subTargetDirsArray[secondaryIndex] !== '') {
              targetPath = path.join(targetDir, subTargetDirsArray[secondaryIndex], path.basename(filePath))
            }            
          } else {
            // If only the primary search text is found, move the file to the primary target directory
            targetPath = path.join(targetDir, path.basename(filePath))
          }

          if (targetDir || (!!targetDir && (targetDir !== filePath))) {
            // Check for filename conflict and generate a new filename
            console.log(`processDirectory moving file to targetPath: ${targetPath}`)
            targetPath = await generateNewFileName(filePath, targetPath)

            await fsExtra.move(filePath, targetPath)
            
          } else {
            totalUpdated++
            targetPath = filePath
          }

          if (customTags.length > 0) {
            // customTags = [...new Set(customTags)]
            customTags = uniqueTitleCaseArray(customTags)
            console.log(`processDirectory,array deduping Keywords: ${customTags}`)
            await ep.writeMetadata(targetPath, {
              "Keywords": '',
            }, ['overwrite_original','codedcharacterset=utf8'])
              .then(console.log)
              .catch(console.error)

            await ep.writeMetadata(targetPath, {
              "Keywords+": customTags,
            }, ['overwrite_original','codedcharacterset=utf8'])
              .then(console.log)
              .catch(console.error)
            } else {
              console.log('processDirectory, not Keywords found...')
            }

          console.log(`File moved to: ${targetPath}`)
          totalProcessed++
          movedFilesPaths.push(targetPath)
        }
      } catch (error) {
        console.error(`An error occurred while processing ${filePath}:`, error)
        totalErrors++
      }
    }
  }
  await ep.close()
  // Display process results
  console.log(`SEND: {"totalProcessed":${totalProcessed}, "totalErrors":${totalErrors}, "movedFilesPaths":${JSON.stringify(movedFilesPaths)}}`)
}

// Start the directory processing function
processDirectory(sourceDir).catch(error => {
  console.error('An error occurred:', error)
})
