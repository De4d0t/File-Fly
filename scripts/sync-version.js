import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPkgPath = path.resolve(__dirname, '../package.json');
const websitePkgPath = path.resolve(__dirname, '../website/package.json');
const versionJsPath = path.resolve(__dirname, '../website/src/config/version.js');

if (!fs.existsSync(rootPkgPath) || !fs.existsSync(websitePkgPath)) {
  console.error('❌ Could not find root package.json or website/package.json');
  process.exit(1);
}

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const websitePkg = JSON.parse(fs.readFileSync(websitePkgPath, 'utf8'));

let targetVersion = process.argv[2];

if (targetVersion) {
  // Strip optional leading 'v' e.g. "v1.1.0" -> "1.1.0"
  targetVersion = targetVersion.replace(/^v/i, '').trim();

  if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(targetVersion)) {
    console.error(`❌ Invalid semver format: "${targetVersion}". Example valid format: "1.1.0" or "2.0.0-beta.1"`);
    process.exit(1);
  }

  rootPkg.version = targetVersion;
  websitePkg.version = targetVersion;

  fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');
  fs.writeFileSync(websitePkgPath, JSON.stringify(websitePkg, null, 2) + '\n', 'utf8');
  fs.writeFileSync(versionJsPath, `export const APP_VERSION = '${targetVersion}';\n`, 'utf8');

  console.log(`\n🎉 Successfully updated FileFly to v${targetVersion} across:`);
  console.log(`   - Root package.json (Desktop app & Electron builder)`);
  console.log(`   - Header bar UI (v${targetVersion})`);
  console.log(`   - website/package.json`);
  console.log(`   - website/src/config/version.js (Website UI & Download route)`);
} else {
  // Sync mode: copy version from root package.json to website
  const currentVersion = rootPkg.version;
  websitePkg.version = currentVersion;

  fs.writeFileSync(websitePkgPath, JSON.stringify(websitePkg, null, 2) + '\n', 'utf8');
  fs.writeFileSync(versionJsPath, `export const APP_VERSION = '${currentVersion}';\n`, 'utf8');

  console.log(`\n🔄 Synced version v${currentVersion} to website (package.json and config/version.js)`);
}
