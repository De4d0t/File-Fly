import { exec, spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

const dir = path.join(os.homedir(), 'Downloads', 'FileFly');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

console.log('Testing opening dir:', dir);

// Method 1: powershell Start-Process
exec(`powershell -NoProfile -Command "Start-Process explorer.exe -ArgumentList '${dir.replace(/'/g, "''")}'"`, (err, stdout, stderr) => {
  console.log('PowerShell method completed:', err ? err.message : 'SUCCESS', stdout, stderr);
});
