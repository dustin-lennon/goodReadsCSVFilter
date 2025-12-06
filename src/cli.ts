import { BookWeightingApp } from './core/BookWeightingApp';
import { handleError } from './utils/errorHandler';

async function main() {
  await BookWeightingApp.run();
}

main().catch((error) => {
  handleError(error, { exitOnError: true });
});
