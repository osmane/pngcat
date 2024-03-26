const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const app = express();
const port = 3000;

// Dosya ID'leri ile dosya yollarını eşleyen objeyi tanımla
const fileAccessMap = {};

app.use(express.json());
app.use(express.static('public'));

app.post('/process-files', (req, res) => {
    const { sourceDir, searchParams } = req.body;

    let results = [];

    async function processEachParam() {
        console.log('Server searchParams: ' + JSON.stringify(searchParams));
        for (const params of searchParams) {
            const { id, searchText, targetDir, secondaries } = params;
            const secondarySearchTexts = secondaries.map(sec => sec.secondarySearchText).join('|');
            const subTargetDirs = secondaries.map(sec => sec.subTargetDir).join('|');

            const args = [sourceDir, searchText, targetDir, secondarySearchTexts, subTargetDirs];

            await new Promise((resolve, reject) => {
                const process = spawn('node', ['processFiles.js', ...args], { cwd: path.join(__dirname) });

                process.stdout.on('data', (data) => {
                    const output = data.toString();
                    const lines = output.split('\n');
                    lines.forEach(line => {
                        if (line.startsWith('SEND:')) {
                            try {
                                const result = JSON.parse(line.replace('SEND:', '').trim());
                                console.log('the SEND line is:', line);
                                results.push({ 
                                    id, 
                                    totalMoved: result.totalMoved, 
                                    totalErrors: result.totalErrors, 
                                    movedFilesPaths: result.movedFilesPaths // Doğrudan dosya yollarını kullan
                                });                                
                                resolve();
                            } catch (parseError) {
                                console.error('Parsing error:', parseError);
                                reject(parseError);
                            }
                        } else {
                            // processFiles.js'den gelen diğer logları göstermek için
                            console.log(line);                            
                        }
                    });
                });              

                process.stderr.on('data', (data) => {
                    console.error(`stderr: ${data}`);
                });

                process.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`processFiles.js exited with code ${code}`));
                    }
                });
            }).catch(error => {
                console.error('File processing error:', error);
                // Herhangi bir hata durumunda da sonuçları ekle
                results.push({ id, error: 'File processing error.' });
            });
        }
        // Tüm işlemler tamamlandıktan sonra, elde edilen sonuçları istemciye gönder
        res.json({ results });
    }

    app.get('/file/*', (req, res) => {
        const filePath = decodeURIComponent(req.params[0]);
        
        if (filePath) {
            res.sendFile(filePath, { root: '/' }, function(err) {
                if (err) {
                    res.status(404).send('Dosya bulunamadı veya erişim izni yok.');
                }
            });
        } else {
            res.status(404).send('Dosya bulunamadı veya erişim izni yok.');
        }
    });

    processEachParam().catch(error => {
        console.error('General file processing error:', error);
        res.status(500).json({ error: 'General file processing error.' });
    });
});

function generateSecureId() {
    // Basit bir ID üretici, gerçekte daha güvenli bir yöntem kullanılmalı
    return Math.random().toString(36).substring(2, 15);
}

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
