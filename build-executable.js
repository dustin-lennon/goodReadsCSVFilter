#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Building GoodReads Book Weighting System Executable...');
console.log('=====================================\n');

// Read version from package.json
let currentVersion;
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    currentVersion = packageJson.version;
    console.log(`📌 Building version: ${currentVersion}\n`);
} catch (err) {
    console.error('⚠️  Warning: Could not read version from package.json');
    currentVersion = null;
}

// Clean up old build artifacts that don't match current version
const distPath = path.join(process.cwd(), 'dist-executable');
if (fs.existsSync(distPath) && currentVersion) {
    console.log('🧹 Cleaning up old build artifacts...');
    const files = fs.readdirSync(distPath);
    let cleanedCount = 0;
    
    files.forEach(file => {
        // Remove old DMG and blockmap files that don't match current version
        if ((file.endsWith('.dmg') || file.endsWith('.dmg.blockmap')) && 
            !file.includes(currentVersion)) {
            const filePath = path.join(distPath, file);
            try {
                fs.unlinkSync(filePath);
                console.log(`   🗑️  Removed: ${file}`);
                cleanedCount++;
            } catch (err) {
                console.warn(`   ⚠️  Could not remove ${file}: ${err.message}`);
            }
        }
    });
    
    if (cleanedCount > 0) {
        console.log(`   ✅ Cleaned up ${cleanedCount} old artifact(s)\n`);
    } else {
        console.log('   ✅ No old artifacts to clean\n');
    }
}

// Check if required files exist
const requiredFiles = ['client_secret.json'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
    console.log('⚠️  Warning: The following required files are missing:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');
    console.log('📋 To set up Google Sheets API access:');
    console.log('   1. Follow the instructions in SETUP.md');
    console.log('   2. Place client_secret.json in this directory');
    console.log('   3. Re-run this build command');
    console.log('');
    console.log('⚙️  The executable will be created, but users will need to add');
    console.log('   client_secret.json to their app data directory after installation.');
    console.log('   See SETUP.md for detailed user instructions.\n');
}

console.log('🔨 Building GUI...');
// First build the GUI, then build the executable
const buildGuiProcess = spawn('pnpm', ['run', 'build:gui'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: true
});

buildGuiProcess.on('close', (guiCode) => {
    if (guiCode !== 0) {
        console.error(`\n❌ GUI build failed with code ${guiCode}`);
        process.exit(guiCode);
        return;
    }
    
    console.log('\n🔨 Building executable with electron-builder...');
    // Build to a system temp dir (APFS) to avoid ExFAT asar integrity failures.
    // Artifacts are copied to dist-executable/ after a successful build.
    const tmpBuildDir = require('os').tmpdir() + '/goodreads-build';
    const buildProcess = spawn('pnpm', [
        'exec', 'electron-builder', '--publish', 'never',
        `--config.directories.output=${tmpBuildDir}`
    ], {
        stdio: 'inherit',
        cwd: process.cwd(),
        shell: true
    });
    
    handleBuildProcess(buildProcess, tmpBuildDir);
});

buildGuiProcess.on('error', (err) => {
    console.error('❌ Failed to start GUI build:', err.message);
    console.error('\n💡 Make sure you have pnpm installed: npm install -g pnpm');
    process.exit(1);
});

function handleBuildProcess(buildProcess, tmpBuildDir) {

    buildProcess.on('close', (code) => {
        if (code === 0) {
            // Copy artifacts from temp dir to dist-executable/
            const distPath = path.join(process.cwd(), 'dist-executable');
            if (!fs.existsSync(distPath)) fs.mkdirSync(distPath, { recursive: true });
            if (tmpBuildDir && fs.existsSync(tmpBuildDir)) {
                const tmpFiles = fs.readdirSync(tmpBuildDir);
                tmpFiles
                    .filter(f => f.endsWith('.dmg') || f.endsWith('.dmg.blockmap') ||
                                 f.endsWith('.exe') || f.endsWith('.AppImage') ||
                                 f === 'latest-mac.yml' || f === 'latest.yml' ||
                                 f === 'builder-debug.yml' || f === 'builder-effective-config.yaml')
                    .forEach(f => fs.copyFileSync(path.join(tmpBuildDir, f), path.join(distPath, f)));
            }

            console.log('\n✅ Build successful!');
            console.log('\n📂 Executable created in:');
            console.log('   ./dist-executable/');

            // List created files and verify versions
            if (fs.existsSync(distPath)) {
                const files = fs.readdirSync(distPath);
                const executables = files.filter(f => f.endsWith('.dmg') || f.endsWith('.exe') || f.endsWith('.AppImage'));
                const blockmaps = files.filter(f => f.endsWith('.dmg.blockmap'));
                
                if (executables.length > 0) {
                    console.log('\n🚀 Created executables:');
                    executables.forEach(file => {
                        const stats = fs.statSync(path.join(distPath, file));
                        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
                        console.log(`   📱 ${file} (${sizeMB} MB)`);
                    });
                    
                    // Verify blockmap files match version
                    if (currentVersion && blockmaps.length > 0) {
                        console.log('\n🔍 Verifying blockmap files:');
                        blockmaps.forEach(blockmap => {
                            if (blockmap.includes(currentVersion)) {
                                console.log(`   ✅ ${blockmap} (version matches)`);
                            } else {
                                console.warn(`   ⚠️  ${blockmap} (version mismatch - expected ${currentVersion})`);
                            }
                        });
                    }
                    
                    console.log('\n💡 To install:');
                    console.log('   • macOS: Double-click the .dmg file and drag to Applications');
                    console.log('   • Windows: Run the .exe installer');
                    console.log('   • Linux: Make the .AppImage executable and run it');
                }
            }
            
            console.log('\n🎯 Your standalone executable is ready!');
        } else {
            console.error(`\n❌ Build failed with code ${code}`);
            console.error('\n🔧 Troubleshooting tips:');
            console.error('   • Make sure all dependencies are installed: pnpm install');
            console.error('   • Try cleaning first: rm -rf dist dist-executable');
            console.error('   • Check if TypeScript compiles: pnpm run build');
            process.exit(code);
        }
    });

    buildProcess.on('error', (err) => {
        console.error('❌ Failed to start build:', err.message);
        console.error('\n💡 Make sure you have pnpm installed: npm install -g pnpm');
        process.exit(1);
    });
}
