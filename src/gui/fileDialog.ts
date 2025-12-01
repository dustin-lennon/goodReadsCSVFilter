import { app, dialog } from 'electron';

app.whenReady().then(async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Select GoodReads CSV File',
        properties: ['openFile'],
        filters: [{ name: 'CSV Files', extensions: ['csv']}],
    });

    if (canceled || filePaths.length === 0) {
        process.exit(1);
    } else {
        console.log(filePaths[0]);
        process.exit(0);
    }
});