import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Strip Vercel's legacy cache-dir env vars so npm/subprocesses never emit cache-dir warnings
const cleanEnv = { ...process.env };
for (const key of Object.keys(cleanEnv)) {
  if (key.toLowerCase() === 'npm_config_cache_dir') {
    delete cleanEnv[key];
  }
}

function runNodeScript(scriptRelativePath, args, cwd) {
  const fullScript = path.join(rootDir, scriptRelativePath);
  const res = spawnSync(process.execPath, [fullScript, ...args], {
    cwd,
    env: cleanEnv,
    stdio: 'inherit',
  });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

console.log('[CRAFT Build] Building @craft/shared...');
runNodeScript('node_modules/typescript/bin/tsc', ['-p', 'packages/shared/tsconfig.json'], rootDir);

console.log('[CRAFT Build] Building @craft/api...');
runNodeScript('node_modules/typescript/bin/tsc', ['-p', 'apps/api/tsconfig.json'], rootDir);

console.log('[CRAFT Build] Building @craft/web...');
runNodeScript(
  'node_modules/next/dist/bin/next',
  ['build'],
  path.join(rootDir, 'apps', 'web')
);
