#!/usr/bin/env python3
"""Package the existing mobile runtime without compiling or copying user data."""
import hashlib
import json
import io
import platform
import subprocess
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RUNTIME = ROOT / '.madlik/runtime'


def main():
    if platform.system() != 'Linux' or platform.machine() != 'x86_64':
        raise SystemExit('This packager currently supports Linux x86_64 only.')
    baseline = json.loads((ROOT / 'madlik/upstream.json').read_text())
    patch = ROOT / 'patches/madlik-mobile.diff'
    build = hashlib.sha256((ROOT / 'madlik/upstream.json').read_bytes() + patch.read_bytes()).hexdigest()[:40]
    package = json.loads((RUNTIME / 'package.json').read_text())
    product = json.loads((RUNTIME / 'lib/vscode/product.json').read_text())
    if package['version'] != baseline['tag'].removeprefix('v'):
        raise SystemExit('Runtime baseline differs from madlik/upstream.json.')
    if package.get('commit') != build or product.get('commit') != build:
        raise SystemExit('Runtime is stale: run madlik/build-preview.sh first.')
    # Check native runtime architecture, rather than relying only on the host.
    elf = (RUNTIME / 'lib/node').read_bytes()[:20]
    if elf[:6] != b'\x7fELF\x02\x01' or elf[18:20] != b'\x3e\x00':
        raise SystemExit('Expected a Linux x86_64 Node binary.')
    required = ['bin/code-server', 'lib/vscode/out/vs/code/browser/workbench/workbench.js',
                'lib/vscode/node_modules/node-pty/build/Release/pty.node']
    for name in required:
        if not (RUNTIME / name).is_file():
            raise SystemExit(f'Missing runtime file: {name}')
    revision = subprocess.check_output(
        ['git', '-c', f'safe.directory={ROOT}', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    name = f'madlik-code-server-{package["version"]}-{build[:12]}-linux-amd64'
    output = ROOT / 'release-packages'
    output.mkdir(exist_ok=True)
    archive = output / f'{name}.tar.gz'
    if archive.exists():
        raise SystemExit(f'Archive already exists: {archive}')

    def clean(info):
        if info.issym() or info.islnk():
            target = Path(info.linkname)
            if target.is_absolute() or '..' in target.parts:
                raise ValueError(f'Nonportable link: {info.name}')
        if not (info.isfile() or info.isdir() or info.issym() or info.islnk()):
            raise ValueError(f'Unexpected special file: {info.name}')
        info.uid = info.gid = 0
        info.uname = info.gname = 'root'
        info.mode = 0o755 if info.isdir() or info.mode & 0o111 else 0o644
        info.pax_headers = {}
        return info

    manifest = {
        'name': name, 'codeServerVersion': package['version'], 'build': build,
        'sourceRevision': revision, 'platform': 'linux-amd64',
        'runtime': 'Bundled Node.js and prebuilt native dependencies',
        'baseline': baseline,
        'mobilePatchSha256': hashlib.sha256(patch.read_bytes()).hexdigest(),
        'testedBuildHost': platform.platform(),
    }
    # Explicit allowlist: never archive preview profiles, configuration or workspaces.
    entries = ['bin', 'lib', 'node_modules', 'out', 'src', 'package.json',
               'npm-shrinkwrap.json', 'LICENSE', 'LICENSE.simple-keyboard', 'ThirdPartyNotices.txt']
    temporary = archive.with_suffix('.partial')
    with tarfile.open(temporary, 'w:gz', compresslevel=6) as tar:
        for entry in entries:
            tar.add(RUNTIME / entry, arcname=f'{name}/{entry}', filter=clean)
        for source, destination in [
            ('madlik/install-portable.sh', 'install.sh'),
            ('madlik/PORTABLE.md', 'INSTALL.md'),
            ('README.md', 'README.md'),
            ('madlik/upstream.json', 'source/upstream.json'),
            ('patches/madlik-mobile.diff', 'source/madlik-mobile.diff'),
        ]:
            tar.add(ROOT / source, arcname=f'{name}/{destination}', filter=clean)
        data = (json.dumps(manifest, indent=2) + '\n').encode()
        info = tarfile.TarInfo(f'{name}/BUILD.json')
        info.size, info.mode = len(data), 0o644
        tar.addfile(info, io.BytesIO(data))
    temporary.rename(archive)
    with archive.open('rb') as handle:
        digest = hashlib.file_digest(handle, 'sha256').hexdigest()
    archive.with_name(archive.name + '.sha256').write_text(f'{digest}  {archive.name}\n')
    print(archive)
    print(f'{archive.stat().st_size / 1024**2:.1f} MiB; SHA256 {digest}')


if __name__ == '__main__':
    main()
