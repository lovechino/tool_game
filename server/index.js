import express from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Paths
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PUBLIC_BUILDS_DIR = path.join(__dirname, 'public/builds');
const SCRIPT_PATH = path.resolve(__dirname, '../scripts/build-game-isolated.cjs');

// Ensure directories exist
fs.ensureDirSync(UPLOADS_DIR);
fs.ensureDirSync(PUBLIC_BUILDS_DIR);

// Configure Multer for Zip Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.zip');
    }
});
const upload = multer({ storage: storage });

const PUBLIC_DIR_SERVER = path.join(__dirname, 'public');

app.use('/builds', express.static(PUBLIC_BUILDS_DIR));
app.use(express.static(PUBLIC_DIR_SERVER)); // Serve UI at root

// Removed simple GET / route to let express.static serve index.html

/**
 * POST /create-game
 * Accepts 'file' (zip) containing reskin assets.
 * Returns { downloadUrl: string }
 */
app.post('/create-game', upload.single('file'), async (req, res) => {
    console.log(`\n========================================`);
    console.log(`🔔 [REQUEST] POST /create-game`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);

    if (!req.file) {
        console.error('❌ [ERROR] No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`✅ [FILE] Received: ${req.file.filename} (${req.file.size} bytes)`);

    const zipPath = req.file.path;
    const extractPath = path.join(UPLOADS_DIR, path.parse(req.file.filename).name);
    const buildId = path.parse(req.file.filename).name;

    console.log(`📂 [EXTRACT] Starting extraction to: ${extractPath}`);

    try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);
        console.log(`✅ [EXTRACT] Complete`);

        // 2. Run Build Script
        console.log(`🚀 [BUILD] Starting build script: ${SCRIPT_PATH}`);
        console.log(`📁 [BUILD] Source: ${extractPath}`);
        console.log(`📍 [BUILD] CWD: ${path.resolve(__dirname, '..')}`);




        await new Promise((resolve, reject) => {
            const child = spawn('node', [SCRIPT_PATH, '--source', extractPath], {
                cwd: path.resolve(__dirname, '..'),
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let scriptOutput = '';

            child.stdout.on('data', (data) => {
                const chunk = data.toString();
                console.log(`[BUILD OUTPUT] ${chunk}`);
                scriptOutput += chunk;
            });

            child.stderr.on('data', (data) => {
                console.error(`❌ [BUILD ERROR] ${data}`);
            });

            child.on('close', (code) => {
                console.log(`🏁 [BUILD] Process exited with code: ${code}`);
                if (code !== 0) {
                    console.error(`❌ [BUILD] Failed with exit code ${code}`);
                    reject(new Error(`Build process exited with code ${code}`));
                } else {
                    const match = scriptOutput.match(/👉 Artifacts are in: (.*)/);
                    if (match && match[1]) {
                        console.log(`✅ [BUILD] Success! Artifacts: ${match[1].trim()}`);
                        resolve(match[1].trim());
                    } else {
                        console.error(`❌ [BUILD] Cannot find artifact path in output`);
                        console.error(`Output was: ${scriptOutput.substring(0, 500)}`);
                        reject(new Error("Could not find artifact path in build output"));
                    }
                }
            });

            child.on('error', (err) => reject(err));
        }).then((distPath) => {
            // 3. Zip the result (dist folder)
            console.log(`📦 [ZIP] Creating archive from: ${distPath}`);
            const outputZipName = `game_${buildId}.zip`;
            const outputZipPath = path.join(PUBLIC_BUILDS_DIR, outputZipName);
            console.log(`📦 [ZIP] Output: ${outputZipPath}`);

            const outputZip = new AdmZip();
            outputZip.addLocalFolder(distPath);
            outputZip.writeZip(outputZipPath);

            console.log(`✅ [SUCCESS] Game ready: ${outputZipName}`);

            // 4. Cleanup
            console.log(`🧹 [CLEANUP] Removing temporary files...`);
            fs.removeSync(zipPath);      // Uploaded zip
            fs.removeSync(extractPath);  // Extracted folder
            console.log(`✅ [CLEANUP] Complete`);
            // Note: Isolated script should ideally clean up its worker dir, 
            // but for now we leave it or rely on script updates. 
            // We can add logic to clean up the worker dir here if we parse the ID.

            // 5. Respond
            console.log(`📤 [RESPONSE] Sending success response`);
            console.log(`========================================\n`);
            res.json({
                success: true,
                downloadUrl: `/builds/${outputZipName}`
            });
        });

    } catch (error) {
        console.error('\n❌ ========== SERVER ERROR ==========');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        console.error('====================================\n');
        res.status(500).json({ error: 'Build failed', details: error.message });

        // Attempt cleanup
        if (fs.existsSync(zipPath)) fs.removeSync(zipPath);
        if (fs.existsSync(extractPath)) fs.removeSync(extractPath);
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Global Error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`\n================================`);
    console.log(`🚀 Gameserver v2.1 running at http://localhost:${port}`);
    console.log(`📂 Uploads Dir: ${UPLOADS_DIR}`);
    console.log(`================================\n`);
});
