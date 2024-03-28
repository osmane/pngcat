const fs = require('fs')
const path = require('path')
const fsExtra = require('fs-extra')
// const exiftool = require('node-exiftool');
// const ep = new exiftool.ExiftoolProcess();

const exiftool = require('node-exiftool')
const exiftoolBin = require('dist-exiftool')
const ep = new exiftool.ExiftoolProcess(exiftoolBin)

// Get values from command line arguments
const [sourceDir, searchText, targetDir, secondarySearchTexts, subTargetDirs, primaryCustomTags, secondaryCustomTags] = process.argv.slice(2)

// Convert multiple secondary search texts and target directories into arrays
const secondarySearchTextArray = secondarySearchTexts ? secondarySearchTexts.split('|') : []
const subTargetDirsArray = subTargetDirs ? subTargetDirs.split('|') : []
const secondaryCustomTagsArray = secondaryCustomTags ? stringToTagstring(secondaryCustomTags).split(',') : []

const primaryRegex = new RegExp(searchText, 'i')

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

    // Read metadata from a PNG file

    const result = await ep.readMetadata(filePath, ['-File:all']) // -j for json format output
    // console.log('readMetadata result t1:', result.toString())

    const metadata = result.data[0] // Metadata for the first file
    let metaDataFound = false
    let secondaryIndex = -1
    let currentKeywords = ''
    // Search and check texts within file metadata
    if (metadata) {
      // Convert metadata to string

      const mdString = JSON.stringify(metadata)
      // console.log(metadata.parameters )

      // Primary and secondary text checks
      if (metadata.parameters && metadata.parameters.match(primaryRegex)) {
        metaDataFound = true
        secondarySearchTextArray.forEach((text, index) => {
          if (mdString.match(new RegExp(text, 'i'))) {
            secondaryIndex = index
          }
        })
      }

      const mdJson = JSON.parse(mdString)
      if ((mdJson.Keywords) || (mdJson.keywords) || mdJson['Keywords'] ) {
        currentKeywords = mdJson.Keywords || mdJson.keywords || mdJson['Keywords']
        console.log(`processFile, Current Keywords t1: ${JSON.stringify(currentKeywords)}`)
      } else {
        console.log('processFile, Current Keywords: ' + mdJson)
      }
      console.log(`processFile, Current mdjson: ${JSON.stringify(mdJson)}`)
    }

    return { found: metaDataFound, secondaryIndex, currentKeywords: currentKeywords }
  } catch (error) {
    console.error(`Error: ${error}`)
    return { found: false }
  }
}

function stringToTagstring(text) {
  return text.replace(/[^a-zA-Z0-9,]/g, '_')
}

// Async directory processing function
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
    let customTags =  []
    if (fileExt === '.png') {
      try {
        const { found, secondaryIndex, currentKeywords } = await processFile(filePath)
        //customTags = [...primaryCustomTagsArray, ...currentKeywords]
        customTags = customTags.concat(primaryCustomTagsArray).concat(currentKeywords)
        if (found) {
          let targetPath
          if (secondaryIndex >= 0) {
            // If a secondary search text is found, move the file to the corresponding sub-directory
            if (subTargetDirsArray[secondaryIndex] !== '') {
              targetPath = path.join(targetDir, subTargetDirsArray[secondaryIndex], path.basename(filePath))
            }
            if (secondaryCustomTagsArray[secondaryIndex]) {
              customTags = customTags.concat(secondaryCustomTagsArray[secondaryIndex]).concat(currentKeywords)
            }
          } else {
            // If only the primary search text is found, move the file to the primary target directory
            targetPath = path.join(targetDir, path.basename(filePath))
          }

          if (targetPath) {
            // Check for filename conflict and generate a new filename
            targetPath = await generateNewFileName(filePath, targetPath)

            await fsExtra.move(filePath, targetPath)
          } else {
            targetPath = filePath
          }

          if (customTags.length > 0) {
            customTags = [...new Set(customTags)]
            console.log(`processDirectory,array deduping Keywords: ${customTags}`)
            await ep.writeMetadata(targetPath, {
              "Keywords": '',
            }, ['overwrite_original'])
              .then(console.log)
              .catch(console.error)

            await ep.writeMetadata(targetPath, {
              "Keywords+": customTags,
            }, ['overwrite_original'])
              .then(console.log)
              .catch(console.error)
          } else {
            console.log('processDirectory, not Keywords found...')
          }

          console.log(`File moved to: ${targetPath}`)
          totalMoved++
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
  console.log(`SEND: {"totalMoved":${totalMoved}, "totalErrors":${totalErrors}, "movedFilesPaths":${JSON.stringify(movedFilesPaths)}}`)
}

// Start the directory processing function
processDirectory(sourceDir).catch(error => {
  console.error('An error occurred:', error)
})
