declare module 'node-file-dialog' {
  interface FileDialogOptions {
    type?: 'open-file' | 'save-file' | 'open-directory';
    accept?: string[]; // file extensions
    multiple?: boolean;
  }

  export default function fileDialog(
    options?: FileDialogOptions
  ): Promise<string[]>;
}