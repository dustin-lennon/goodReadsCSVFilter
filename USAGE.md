# Running GoodReads Book Weighting System

## 🔧 First-Time Setup

**Before running the application for the first time**, you need to set up Google Sheets API access:

📖 **See [SETUP.md](./SETUP.md) for complete setup instructions**

Quick summary:
1. Create Google Cloud project with Sheets API enabled
2. Download OAuth credentials as `client_secret.json`
3. Place the file in the correct location for your chosen version

---

You now have **two ways** to run the GoodReads Book Weighting System:

## 📟 CLI Version (Original)

The command-line interface version that runs in your terminal:

```bash
# Run the CLI version
pnpm start

# Or with npm if you prefer
npm start
```

**Features:**
- Runs entirely in the terminal
- Shows progress with text output
- Minimal resource usage
- Good for automation/scripting

---

## 🖥️ GUI Version (New!)

A beautiful desktop application with a graphical interface:

```bash
# Run the GUI version
pnpm run start:gui

# Or if you have issues, try the standalone script
node start-gui.js
```

**Features:**
- Modern desktop application interface
- Step-by-step wizard
- Progress tracking with visual feedback
- Results displayed in organized cards
- Direct links to open Google Sheets
- Confirmation windows and error handling

---

## 📦 Creating an Executable

To create a standalone executable that you can run without Node.js:

```bash
# Install dependencies (if not already done)
pnpm install

# Build the executable (recommended)
node build-executable.js

# Or use the npm script directly
pnpm run build:executable
```

This will create platform-specific executables in the `dist-executable` folder:
- **macOS**: `GoodReads Book Weighting System-1.0.0-arm64.dmg` (106 MB)
- **Windows**: `.exe` installer  
- **Linux**: `.AppImage` file

### Running the Executable

Once built, you can:
1. Install the app like any other desktop application
2. Run it from your Applications folder (macOS) or Start Menu (Windows)
3. Double-click the executable file

---

## 🔧 Troubleshooting

### GUI Won't Start
If the GUI version has issues:

1. **Try the standalone script:**
   ```bash
   node start-gui.js
   ```

2. **Check Electron installation:**
   ```bash
   pnpm run build:gui
   ./node_modules/.bin/electron --version
   ```

3. **Fall back to CLI:**
   ```bash
   pnpm start
   ```

### Permission Issues (macOS/Linux)
If you get permission errors:

```bash
chmod +x start-gui.js
chmod +x node_modules/.bin/electron
```

---

## 🎯 Which Version Should I Use?

### Use **CLI** if:
- You're comfortable with terminal/command line
- You want to script or automate the process
- You prefer minimal resource usage
- You're running on a server or headless system

### Use **GUI** if:
- You prefer visual interfaces
- You want to see results in an organized format
- You like step-by-step wizards
- You want easy access to Google Sheets

### Use **Executable** if:
- You want to distribute to non-technical users
- You don't want to install Node.js/pnpm
- You prefer traditional desktop applications
- You want to run it on computers without development tools

---

## 🚀 Quick Start

1. **First time setup:**
   ```bash
   pnpm install
   ```

2. **Run your preferred version:**
   ```bash
   # CLI (fastest)
   pnpm start
   
   # GUI (prettiest)
   pnpm run start:gui
   
   # Executable (most portable)
   pnpm run build:executable
   ```

Both versions produce identical results - they use the same core logic for series detection and weighting. Choose the interface that works best for you!
