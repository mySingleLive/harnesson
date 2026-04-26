import { execFileSync } from 'node:child_process';
import process from 'node:process';

export function pickFolder(): string | null {
  const platform = process.platform;

  if (platform === 'darwin') {
    return pickFolderMacOS();
  } else if (platform === 'linux') {
    return pickFolderLinux();
  } else if (platform === 'win32') {
    return pickFolderWindows();
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

function pickFolderMacOS(): string | null {
  try {
    const result = execFileSync('osascript', [
      '-e',
      'POSIX path of (choose folder with prompt "选择项目文件夹")',
    ], { encoding: 'utf-8', timeout: 300_000 });

    return result.trim() || null;
  } catch (err: any) {
    if (err.status === 1 || err.status === 12) return null;
    throw err;
  }
}

function pickFolderLinux(): string | null {
  try {
    const result = execFileSync('zenity', [
      '--file-selection', '--directory',
      '--title=选择项目文件夹',
    ], { encoding: 'utf-8', timeout: 300_000 });

    return result.trim() || null;
  } catch (err: any) {
    if (err.status === 1) return null;
    throw err;
  }
}

function pickFolderWindows(): string | null {
  const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = '选择项目文件夹'
    if ($dialog.ShowDialog() -eq 'OK') { $dialog.SelectedPath } else { '' }
  `.trim();

  try {
    const result = execFileSync('powershell', [
      '-NoProfile', '-NonInteractive', '-Command', ps,
    ], { encoding: 'utf-8', timeout: 300_000 });

    return result.trim() || null;
  } catch {
    return null;
  }
}
