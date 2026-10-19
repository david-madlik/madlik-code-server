#!/usr/bin/env python3
"""Exercise a relocated archive, user installer, bundled Node, PTY and HTTP."""
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.request

root = Path(__file__).resolve().parent.parent
archive = Path(sys.argv[1]).resolve()
with archive.open('rb') as handle:
    digest = hashlib.file_digest(handle, 'sha256').hexdigest()
assert digest == Path(str(archive) + '.sha256').read_text().split()[0], 'Checksum mismatch'

with tempfile.TemporaryDirectory(prefix='portable smoke ', dir=root / '.madlik') as temp:
    temp = Path(temp)
    with tarfile.open(archive) as tar:
        names = {member.name.split('/')[1] for member in tar.getmembers() if '/' in member.name}
        assert not names.intersection({'user-data', 'extensions', 'workspace', 'config.yaml', 'logs'})
        tar.extractall(temp, filter='data')
    package = temp / archive.name.removesuffix('.tar.gz')
    prefix = temp / 'installed prefix'
    env = {**os.environ, 'HOME': str(temp / 'home'), 'XDG_CONFIG_HOME': str(temp / 'config'),
           'XDG_DATA_HOME': str(temp / 'data')}
    subprocess.run(['sh', str(package / 'install.sh'), str(prefix)], env=env, check=True)
    assert not (temp / 'config/code-server/config.yaml').exists(), 'Installer created user config'
    # Existing installations must not be overwritten.
    assert subprocess.run(['sh', str(package / 'install.sh'), str(prefix)], env=env,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode != 0
    installed = prefix / 'opt' / package.name
    metadata = json.loads((installed / 'BUILD.json').read_text())
    version = subprocess.check_output([str(prefix / 'bin/madlik-code-server'), '--config', '/dev/null', '--version'], env=env, text=True)
    assert metadata['build'] in version, version
    native = '''
const path = require('path');
const root = process.argv[1];
require(path.join(root, 'node_modules/argon2'));
const pty = require(path.join(root, 'lib/vscode/node_modules/node-pty'));
let output = '';
const term = pty.spawn('/bin/sh', ['-c', 'printf portable-pty-ok'], {name:'xterm-256color', cols:80, rows:24, cwd:process.cwd(), env:process.env});
const timeout = setTimeout(() => { term.kill(); process.exit(1); }, 10000);
term.onData(data => output += data);
term.onExit(({exitCode}) => { clearTimeout(timeout); if(exitCode || !output.includes('portable-pty-ok')) process.exit(1); });
'''
    subprocess.run([str(installed / 'lib/node'), '-e', native, str(installed)], env=env, check=True, timeout=15)
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        port = listener.getsockname()[1]
    workspace = temp / 'workspace'
    workspace.mkdir()
    (workspace / 'hello.txt').write_text('Portable smoke test\n')
    config = temp / 'smoke.yaml'
    config.write_text('cert: false\n')
    command = [str(prefix / 'bin/madlik-code-server'), '--config', str(config),
               '--bind-addr', f'127.0.0.1:{port}', '--auth', 'none', '--disable-telemetry',
               '--user-data-dir', str(temp / 'user-data'), '--extensions-dir', str(temp / 'extensions'),
               '--vscode-option', f'shared-data-dir={temp / "shared"}',
               '--disable-workspace-trust', str(workspace)]
    with (temp / 'server.log').open('w+') as log:
        server = subprocess.Popen(command, env=env, stdout=log, stderr=log, start_new_session=True)
        try:
            base = f'http://127.0.0.1:{port}'
            for attempt in range(60):
                try:
                    with urllib.request.urlopen(base, timeout=2) as response:
                        assert response.status == 200
                        assert b'workbench' in response.read()
                    break
                except OSError:
                    if server.poll() is not None:
                        raise RuntimeError('Server exited')
                    time.sleep(0.5)
            else:
                raise RuntimeError('Server did not respond')
            subprocess.run(['node', str(root / 'madlik/test-portable-browser.mjs'), base,
                            str(workspace)], env=env, check=True, timeout=120)
            print('PASS: checksum, relocated installation, overwrite protection, version, native PTY, HTTP, mobile/desktop browser')
        except BaseException:
            log.seek(0)
            print(log.read(), file=sys.stderr)
            raise
        finally:
            import signal
            os.killpg(server.pid, signal.SIGTERM)
            server.wait(timeout=15)
