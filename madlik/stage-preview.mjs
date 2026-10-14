// Stage only inside this checkout. Never modify the installed distribution.
import { cp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = process.env.MADLIK_BASE_DISTRIBUTION || '/usr/lib/code-server';
const baseline = JSON.parse(await readFile(path.join(root, 'madlik/upstream.json'), 'utf8'));
const pkg = JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
if (`v${pkg.version}` !== baseline.tag) {
  throw new Error(`Preview requires ${baseline.tag}; distribution has ${pkg.version}`);
}
const cache = path.join(root, '.madlik');
const runtime = path.join(cache, 'runtime');
const out = path.join(root, 'lib/vscode/out-madlik');
const build = JSON.parse(await readFile(path.join(cache, 'build.json'), 'utf8'));
if (!/^[a-f0-9]{40}$/.test(build.commit)) throw new Error('Invalid preview build identifier');
await access(path.join(out, 'vs/code/browser/workbench/workbench.js'));
await mkdir(cache, { recursive: true });
await cp(source, runtime, { recursive: true });
await cp(out, path.join(runtime, 'lib/vscode/out'), { recursive: true });
// The server routes and client product must use the same build identity.
// Deriving it from the patch also invalidates browser caches after UI changes.
const runtimePackagePath = path.join(runtime, 'package.json');
const runtimePackage = JSON.parse(await readFile(runtimePackagePath, 'utf8'));
runtimePackage.commit = build.commit;
await writeFile(runtimePackagePath, JSON.stringify(runtimePackage, null, 2));
const productPath = path.join(runtime, 'lib/vscode/product.json');
const product = JSON.parse(await readFile(productPath, 'utf8'));
product.commit = build.commit;
await writeFile(productPath, JSON.stringify(product, null, 2));
const workspace = path.join(cache, 'workspace');
try { await access(path.join(workspace, '.git')); }
catch {
  await mkdir(workspace, { recursive: true });
  await writeFile(path.join(workspace, 'hello.ts'), 'export const greeting = "hello desktop";\n');
  const git = (...args) => execFileSync('git', ['-C', workspace, ...args]);
  git('init', '--initial-branch=main');
  git('add', 'hello.ts');
  git('-c', 'user.name=Madlik Test', '-c', 'user.email=test@localhost', '-c', 'commit.gpgsign=false', 'commit', '-m', 'Test fixture');
  await writeFile(path.join(workspace, 'hello.ts'), 'export const greeting = "hello mobile";\n');
}
await mkdir(path.join(cache, 'user-data/User'), { recursive: true });
await writeFile(path.join(cache, 'user-data/User/settings.json'), JSON.stringify({
  'workbench.startupEditor': 'none',
  'workbench.colorTheme': 'Default Dark Modern',
  'workbench.secondarySideBar.defaultVisibility': 'hidden',
  'security.workspace.trust.enabled': false,
  'telemetry.telemetryLevel': 'off',
  'terminal.integrated.defaultProfile.linux': 'bash',
}, null, 2));
await writeFile(path.join(cache, 'config.yaml'), 'bind-addr: 127.0.0.1:18110\nauth: none\ncert: false\ndisable-telemetry: true\n');
console.log(`Isolated preview staged at ${runtime}`);
