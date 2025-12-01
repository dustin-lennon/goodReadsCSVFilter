import { spawnSync } from "child_process";
import path from "path";

export function selectCSVFile(): string {
    const dialogScript = path.join(__dirname, '../../dist/gui/fileDialog.js');

    const result = spawnSync('npx', ['electron', dialogScript], {
        encoding: 'utf-8'
    });

    if (result.status !== 0) {
        throw new Error('File dialog was cancelled or failed.');
    }

    return result.stdout.trim();
}