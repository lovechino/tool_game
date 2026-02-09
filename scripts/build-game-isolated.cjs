const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Helper to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Helper to delete directory recursively
function removeDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

// Main logic
try {
    const args = process.argv.slice(2);
    const sourceArgIndex = args.indexOf('--source');

    if (sourceArgIndex === -1 || sourceArgIndex + 1 >= args.length) {
        console.error('❌ Usage: node scripts/build-game-isolated.cjs --source <path_to_assets>');
        process.exit(1);
    }

    const sourcePath = path.resolve(args[sourceArgIndex + 1]);
    if (!fs.existsSync(sourcePath)) {
        console.error(`❌ Source path not found: ${sourcePath}`);
        process.exit(1);
    }

    // 1. Create a temporary worker directory
    const workerId = `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const workerDir = path.resolve(__dirname, `../.workers/${workerId}`);
    const publicDir = path.join(workerDir, 'public');
    const outDir = path.join(workerDir, 'dist');

    console.log(`🔨 Starting build job: ${workerId}`);
    console.log(`   Worker Dir: ${workerDir}`);

    // 2. Setup Worker: Copy original public folder
    console.log('📂 Setting up workspace...');
    const originalPublic = path.resolve(__dirname, '../public');
    copyDir(originalPublic, publicDir);

    // 3. Inject User Assets
    console.log('🎨 Injecting assets...');
    const reskinDir = path.join(publicDir, 'assets/reskin');
    // Ensure reskin dir exists and is empty/ready
    if (fs.existsSync(reskinDir)) removeDir(reskinDir);
    fs.mkdirSync(reskinDir, { recursive: true });
    copyDir(sourcePath, reskinDir);

    // 4. Run Sync Assets with Environment Variables
    console.log('🔄 Syncing assets and config...');
    // We pass PUBLIC_DIR to the script via env
    execSync('node scripts/sync-assets.cjs', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
        env: { ...process.env, PUBLIC_DIR: publicDir }
    });

    // 5. Run Vite Build
    console.log('🚀 Building game...');
    execSync('npx vite build', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
        env: { ...process.env, PUBLIC_DIR: publicDir, OUT_DIR: outDir }
    });

    console.log(`✅ Build successful! Output: ${outDir}`);
    // Here you would typically zip the dist folder or move it to a final location
    // For now, we leave it there for inspection or move to a common 'builds' dir

    // Example: Move to final builds folder
    // const finalBuildDir = path.resolve(__dirname, '../builds', workerId);
    // fs.renameSync(outDir, finalBuildDir);
    // removeDir(workerDir); 

    console.log(`👉 Artifacts are in: ${outDir}`);

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
