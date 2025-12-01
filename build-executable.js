#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Building GoodReads Book Weighting System Executable...');
console.log('=====================================\n');

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

console.log('🔨 Building executable...');
const buildProcess = spawn('pnpm', ['run', 'build:executable'], {
    stdio: 'inherit',
    cwd: process.cwd()
});

buildProcess.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Build successful!');
        console.log('\n📂 Executable created in:');
        console.log('   ./dist-executable/');
        
        // List created files
        const distPath = path.join(process.cwd(), 'dist-executable');
        if (fs.existsSync(distPath)) {
            const files = fs.readdirSync(distPath);
            const executables = files.filter(f => f.endsWith('.dmg') || f.endsWith('.exe') || f.endsWith('.AppImage'));
            
            if (executables.length > 0) {
                console.log('\n🚀 Created executables:');
                executables.forEach(file => {
                    const stats = fs.statSync(path.join(distPath, file));
                    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
                    console.log(`   📱 ${file} (${sizeMB} MB)`);
                });
                
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
    }
});

buildProcess.on('error', (err) => {
    console.error('❌ Failed to start build:', err.message);
    console.error('\n💡 Make sure you have pnpm installed: npm install -g pnpm');
});
