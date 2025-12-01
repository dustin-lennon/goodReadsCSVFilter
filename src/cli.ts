import { BookWeightingApp } from './core/BookWeightingApp';

async function main() {
    await BookWeightingApp.run();
}

main().catch(error => {
    console.error('❌ Application crashed:', error);
    process.exit(1);
});