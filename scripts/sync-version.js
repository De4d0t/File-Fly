import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPkgPath = path.resolve(__dirname, '../package.json');

if (!fs.existsSync(rootPkgPath)) {
  console.error('❌ Could not find package.json');
  process.exit(1);
}

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));

let targetVersion = process.argv[2];

if (targetVersion) {
  targetVersion = targetVersion.replace(/^v/i, '').trim();

  if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(targetVersion)) {
    console.error(`❌ Invalid semver format: "${targetVersion}". Example valid format: "1.1.0" or "2.0.0-beta.1"`);
    process.exit(1);
  }

  rootPkg.version = targetVersion;
  fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');

  console.log(`\n🎉 Successfully updated FileFly desktop app to v${targetVersion} in:`);
  console.log(`   - package.json (Desktop app & Electron builder)`);
  console.log(`   - Header bar UI (v${targetVersion})`);
} else {
  console.log(`\nℹ️ Current FileFly version: v${rootPkg.version}`);
}
