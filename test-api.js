import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

// 1. Create a dummy zip file
const zip = new AdmZip();
zip.addFile("test.txt", Buffer.from("Hello World"));
// Add dummy assets to simulate real payload
if (fs.existsSync('public/assets/images/bg/board_Scene_1.png')) {
    zip.addLocalFile('public/assets/images/bg/board_Scene_1.png', '', 's1_board.png');
}
const zipPath = 'test_payload.zip';
zip.writeZip(zipPath);
console.log('✅ Created test_payload.zip');

// 2. Upload using fetch
async function testUpload() {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(zipPath);
    const blob = new Blob([fileBuffer], { type: 'application/zip' });
    formData.append('file', blob, 'test_payload.zip');

    console.log('🚀 Uploading to http://localhost:3000/create-game ...');
    try {
        const response = await fetch('http://localhost:3000/create-game', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('🎉 Success! Response:', data);

        if (data.downloadUrl) {
            console.log(`👉 Download Link: ${data.downloadUrl}`);
        }
    } catch (error) {
        console.error('❌ Upload failed:', error.message);
    }
}

testUpload();
