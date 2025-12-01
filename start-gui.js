#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting GoodReads Book Weighting System (GUI)...');
console.log('📁 Project directory:', process.cwd());

// Build the GUI first
console.log('🔨 Building GUI...');
const buildProcess = spawn('pnpm', ['run', 'build:gui'], {
    stdio: 'inherit',
    cwd: process.cwd()
});

buildProcess.on('close', (code) => {
    if (code === 0) {
        console.log('✅ Build successful!');
        
        // Run Electron
        console.log('🖥️  Starting Electron app...');
        const electronPath = path.join(process.cwd(), 'node_modules', '.bin', 'electron');
        const mainPath = path.join(process.cwd(), 'dist', 'gui', 'main.js');
        
        const electronProcess = spawn(electronPath, [mainPath], {
            stdio: 'inherit'
        });
        
        electronProcess.on('close', (electronCode) => {
            console.log(`🏁 Electron app closed with code ${electronCode}`);
            process.exit(electronCode);
        });
        
        electronProcess.on('error', (err) => {
            console.error('❌ Failed to start Electron:', err.message);
            process.exit(1);
        });

        // Handle process termination signals
        process.on('SIGINT', () => {
            console.log('\n🛑 Received SIGINT, shutting down gracefully...');
            electronProcess.kill('SIGTERM');
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
            electronProcess.kill('SIGTERM');
        });
        
    } else {
        console.error(`❌ Build failed with code ${code}`);
    }
});

buildProcess.on('error', (err) => {
    console.error('❌ Failed to start build:', err.message);
});
