# GoodReads Book Weighting System - Setup Instructions

## 📋 Required Files for First-Time Setup

Before using the application, you need to set up Google Sheets API access:

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Configure the consent screen if prompted
6. Choose **Desktop Application** as the application type
7. Download the credentials JSON file

### 2. Install the Credentials File

**For Development (CLI/GUI from source):**
- Rename the downloaded file to `client_secret.json`
- Place it in the project root directory (same folder as `package.json`)

**For Installed Application (.dmg/.exe/.AppImage):**
- Rename the downloaded file to `client_secret.json`
- Place it in the application's data directory:
- If you have an existing `sheet-id.txt` file (from previous usage), place it in the same directory

**macOS:**
```
~/Library/Application Support/GoodReads Book Weighting System/client_secret.json
~/Library/Application Support/GoodReads Book Weighting System/sheet-id.txt
```

**Windows:**
```
%APPDATA%\GoodReads Book Weighting System\client_secret.json
%APPDATA%\GoodReads Book Weighting System\sheet-id.txt
```

**Linux:**
```
~/.config/GoodReads Book Weighting System/client_secret.json
~/.config/GoodReads Book Weighting System/sheet-id.txt
```

### 3. First Run Authentication

1. Run the application
2. It will open a browser window for Google authentication
3. Sign in with your Google account
4. Grant permission to access Google Sheets
5. The application will save your authentication token automatically

### 4. Usage

After setup, the application will:
- Read your GoodReads CSV file
- Analyze your reading patterns
- Apply intelligent weighting to series continuations
- Export results to a new Google Sheets document
- Provide you with a link to the sheet for your book selection wheel

## 🔧 Troubleshooting

### "client_secret.json not found" Error
- Make sure the file is in the correct location (see step 2 above)
- Check that the filename is exactly `client_secret.json` (not `client_secret.json.txt`)

### Authentication Issues
- Delete the `token.json` file (if it exists) and try again
- Make sure you're using the correct Google account
- Verify that the Google Sheets API is enabled in your project

### Permission Errors
- On macOS/Linux, you may need to grant the application permission to access files
- Check your system's privacy settings

## 💡 Tips

- Keep a backup of your `client_secret.json` file
- You only need to authenticate once - the token is saved for future use
- The application creates a new Google Sheet each time unless you specify an existing one
- Your CSV data stays on your computer - only the weighted results are uploaded to Google Sheets
