const express = require('express')
const { spawn } = require('child_process')
const path = require('path')
const app = express()
const fs = require('fs-extra')
const jsonfile = require('jsonfile')
const port = 3000

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next(); // Sonraki middleware veya rota işleyiciye geçişi sağlar
});

app.use(express.json())
app.use(express.static('public'))

const fileAccessMap = {}

app.post('/process-files', (req, res) => {
  const { sourceDir, searchParams, jsonData } = req.body

  const results = []

  async function processEachParam() {
    console.log('Server searchParams: ' + JSON.stringify(searchParams))    

    for (const params of searchParams) {
      const { id, searchText, targetDir, secondaries, primaryCustomTags, checkpointChecked, loraChecked } = params
      const secondarySearchTexts = secondaries.map(sec => sec.secondarySearchText).join('|')
      const subTargetDirs = secondaries.map(sec => sec.subTargetDir).join('|')
      const secondaryCustomTags = secondaries.map(sec => sec.secondaryCustomTags).join('|')

      const args = [sourceDir, searchText, targetDir, secondarySearchTexts, subTargetDirs, primaryCustomTags, secondaryCustomTags, checkpointChecked, loraChecked]

      await new Promise((resolve, reject) => {
        const process = spawn('node', ['processFiles.js', ...args], { cwd: path.join(__dirname) })

        process.stdout.on('data', (data) => {
          const output = data.toString()
          const lines = output.split('\n')
          lines.forEach(line => {
            if (line.startsWith('SEND:')) {
              try {
                const result = JSON.parse(line.replace('SEND:', '').trim())
                console.log('the SEND line is:', line)
                results.push({
                  id,
                  totalMoved: result.totalMoved,
                  totalErrors: result.totalErrors,
                  movedFiles: result.movedFilesPaths.map(filePath => {
                    const fileId = generateSecureId()
                    fileAccessMap[fileId] = filePath // Store the file path
                    return {
                      fileId: fileId, // Unique ID for the file
                      filePath: filePath // Actual file path text
                    }
                  })
                })
                resolve()
              } catch (parseError) {
                console.error('Parsing error:', parseError)
                reject(parseError)
              }
            } else {
              // Show other logs from processFiles.js
              console.log(line)
            }
          })
        })

        process.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`)
        })

        process.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`processFiles.js exited with code ${code}`))
          }
        })
      }).catch(error => {
        console.error('File processing error:', error)
        // Add results even in case of any error
        results.push({ id, error: 'File processing error.' })
      })      
    }

     jsonStr = JSON.stringify(jsonData)
     console.log('jsonData: ' + jsonStr)
    if (!!jsonData && jsonData.tags.length > 0) {
      jsonfile.writeFile('./data/json-tags.json', jsonData, { spaces: 2 })
        .then(() => {
          // console.log('JSON başarıyla kaydedildi.');
          results.push({ jsonDataSaved: 'JSON başarıyla kaydedildi.' });
        })
        .catch(err => {
          console.error('json-tags.json kaydedilemedi:', err);
          results.push({ jsonDataError: 'json-tags.json kaydedilemedi.' });
        });
    }else{
      console.error('jsonData empty or tags empty.');
      results.push({ jsonDataError: 'jsonData empty or tags empty.' });
    }
    // Send the obtained results to the client after all processes are completed
    res.json({ results })
  }

  app.get('/file/:fileId', (req, res) => {
    const { fileId } = req.params
    const filePath = fileAccessMap[fileId]

    if (filePath) {
      res.sendFile(filePath)
    } else {
      res.status(404).send('File not found or access denied.')
    }
  })

  processEachParam().catch(error => {
    console.error('General file processing error:', error)
    res.status(500).json({ error: 'General file processing error.' })
  })
})

function generateSecureId() {
  return Math.random().toString(36).substring(2, 15)
}

app.get('/get-data', (req, res) => {
  
  jsonfile.readFile('data/json-tags.json', 'utf8', (err, obj) => {
    if (err) {
      console.error('hata var bilader: ' + err);
      return res.status(500).send('Dosya okunamadı.');
    } else {
      console.log('jsonData: ' + JSON.stringify(obj))
    }
    res.json(obj);
  });

});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})