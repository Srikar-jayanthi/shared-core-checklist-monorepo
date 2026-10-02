import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();

console.log('=== VERIFYING MONOREPO AND CLEAN ARCHITECTURE REQUIREMENTS ===\n');

// 1. Root package.json workspaces
console.log('Checking Requirement 1: Monorepo workspace configuration...');
const rootPkgPath = path.join(rootDir, 'package.json');
if (!fs.existsSync(rootPkgPath)) {
  throw new Error('FAIL: Root package.json not found');
}
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
if (!rootPkg.workspaces || !Array.isArray(rootPkg.workspaces) || !rootPkg.workspaces.includes('packages/*')) {
  throw new Error('FAIL: Root package.json must contain "workspaces": ["packages/*"]');
}
const requiredPackages = ['packages/core', 'packages/web', 'packages/desktop'];
for (const p of requiredPackages) {
  if (!fs.existsSync(path.join(rootDir, p, 'package.json'))) {
    throw new Error(`FAIL: Package directory ${p} does not contain a package.json`);
  }
}
console.log('PASS: Monorepo structure confirmed with all 3 packages.\n');

// 2. Core package purity
console.log('Checking Requirement 2: Core package purity...');
const corePkgPath = path.join(rootDir, 'packages/core/package.json');
const corePkg = JSON.parse(fs.readFileSync(corePkgPath, 'utf8'));
const forbiddenDeps = [
  'react', 'react-dom', 'vue', 'svelte', 'next', 'nuxt',
  'electron', 'tauri', 'react-native', 'expo'
];
const allCoreDeps = {
  ...(corePkg.dependencies || {}),
  ...(corePkg.devDependencies || {})
};
for (const forbidden of forbiddenDeps) {
  if (allCoreDeps[forbidden]) {
    throw new Error(`FAIL: Core package contains forbidden UI dependency: ${forbidden}`);
  }
}
console.log('PASS: Core package contains zero UI framework dependencies.\n');

// 3. Web UI package dependency
console.log('Checking Requirement 3: Web UI package dependency...');
const webPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'packages/web/package.json'), 'utf8'));
if (!webPkg.dependencies || !webPkg.dependencies['@checklist/core']) {
  throw new Error('FAIL: packages/web/package.json does not declare @checklist/core dependency');
}
console.log('PASS: Web package declares @checklist/core dependency.\n');

// 4. Desktop package dependency
console.log('Checking Requirement 4: Desktop package dependency...');
const desktopPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'packages/desktop/package.json'), 'utf8'));
if (!desktopPkg.dependencies || !desktopPkg.dependencies['@checklist/core']) {
  throw new Error('FAIL: packages/desktop/package.json does not declare @checklist/core dependency');
}
console.log('PASS: Desktop package declares @checklist/core dependency.\n');

// 5 & 10. Port & Adapter implementation
console.log('Checking Requirement 10: Port & Adapter implementation...');
const adapterPath = path.join(rootDir, 'packages/web/src/storage/LocalStorageAdapter.ts');
if (!fs.existsSync(adapterPath)) {
  throw new Error('FAIL: LocalStorageAdapter.ts not found in packages/web/src/storage');
}
const adapterContent = fs.readFileSync(adapterPath, 'utf8');
if (!adapterContent.includes('implements IStorageAdapter') || !adapterContent.includes('localStorage')) {
  throw new Error('FAIL: LocalStorageAdapter must implement IStorageAdapter and use localStorage');
}
console.log('PASS: LocalStorageAdapter properly implements IStorageAdapter port.\n');

// 6 & 7. Data test attributes in Web UI
console.log('Checking Requirements 6 & 7: Web UI data-testid attributes...');
const appContent = fs.readFileSync(path.join(rootDir, 'packages/web/src/App.tsx'), 'utf8');
const requiredTestIds = [
  'data-testid="task-input"',
  'data-testid="add-task-btn"',
  'data-testid="task-item"',
  'data-testid="task-checkbox"',
  'data-testid="delete-task-btn"',
  'data-testid="filter-all"',
  'data-testid="filter-active"',
  'data-testid="filter-completed"'
];
for (const testId of requiredTestIds) {
  if (!appContent.includes(testId)) {
    throw new Error(`FAIL: Missing required attribute ${testId} in App.tsx`);
  }
}
console.log('PASS: All required data-testid attributes are present in Web App.\n');

// 8 & 9. Core unit tests execution
console.log('Checking Requirement 9: Executing core unit tests...');
execSync('npm test --workspace=@checklist/core', { stdio: 'inherit' });
console.log('PASS: Core unit tests completed with exit code 0.\n');

// Build verification for all packages
console.log('Verifying compilation of all workspace packages...');
execSync('npm run build', { stdio: 'inherit' });
console.log('PASS: Monorepo build completed successfully with exit code 0.\n');

console.log('=== ALL 10 REQUIREMENTS VERIFIED SUCCESSFULLY ===');
