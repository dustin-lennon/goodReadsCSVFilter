import path from 'path';

// Helper function to find project root by looking for package.json
function findProjectRoot(startDir: string): string | null {
  const fs = require('fs');
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Get resource path that works in both development and packaged Electron app
 * Checks multiple locations in order:
 * 1. UserData directory (for user files in Electron)
 * 2. Project root (found by looking for package.json)
 * 3. Resources path (for bundled files in packaged apps)
 * 4. Current working directory (fallback)
 */
export function getResourcePath(filename: string): string {
  const fs = require('fs');
  const pathsToCheck: string[] = [];

  // Check if we're in Electron (development or packaged)
  let isElectron = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let electronApp: any = null;
  let projectRoot: string | null = null;

  try {
    electronApp = require('electron');
    isElectron = !!electronApp?.app;

    if (isElectron && electronApp?.app) {
      const app = electronApp.app;

      // In Electron, get the app path which points to project root in development
      if (app.getAppPath) {
        try {
          const appPath = app.getAppPath();
          // Find project root by walking up from app path
          projectRoot = findProjectRoot(appPath);

          // In development, app.getAppPath() might be the dist folder, so walk up
          if (!projectRoot) {
            projectRoot = findProjectRoot(path.dirname(appPath));
          }
        } catch {
          // If app.getAppPath fails, continue with other methods
        }
      }
    }
  } catch {
    // Electron not available
  }

  // Find project root from various sources if not found yet
  if (!projectRoot) {
    // Try from compiled file location (__dirname in CommonJS)
    try {
      if (typeof __dirname !== 'undefined') {
        projectRoot = findProjectRoot(__dirname);
      }
    } catch {
      // __dirname not available, continue with other methods
    }

    // Try from require.main if available
    if (!projectRoot && require.main) {
      projectRoot = findProjectRoot(require.main.filename || process.cwd());
    }

    // Try from current working directory as last resort
    if (!projectRoot) {
      projectRoot = findProjectRoot(process.cwd());
    }
  }

  // Build list of paths to check in priority order
  // 1. Project root (highest priority for development files like client_secret.json)
  if (projectRoot) {
    pathsToCheck.push(path.join(projectRoot, filename));
  }

  // 2. In Electron: UserData directory (for user-created files like token.json)
  if (isElectron && electronApp?.app?.getPath) {
    const userDataPath = path.join(electronApp.app.getPath('userData'), filename);
    pathsToCheck.push(userDataPath);
  }

  // 3. Resources path (for packaged apps)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resourcesPath = (process as any).resourcesPath;
  if (resourcesPath) {
    pathsToCheck.push(path.join(resourcesPath, filename));
  }

  // 4. Current working directory (fallback)
  pathsToCheck.push(path.join(process.cwd(), filename));

  // Check each path in order and return the first that exists
  for (const checkPath of pathsToCheck) {
    if (fs.existsSync(checkPath)) {
      return checkPath;
    }
  }

  // If file doesn't exist, return the most appropriate path for error message
  // Prefer project root, then userData, then cwd
  if (projectRoot) {
    return path.join(projectRoot, filename);
  }
  if (isElectron && electronApp?.app?.getPath) {
    return path.join(electronApp.app.getPath('userData'), filename);
  }
  return path.join(process.cwd(), filename);
}
