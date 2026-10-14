# Development and isolated preview

madlik-code-server is a code-server distribution with a source-level mobile
workbench patch. User-facing controls are described in the [main README](README.md).
The baseline is pinned in [madlik/upstream.json](madlik/upstream.json):
code-server 4.141.0, VS Code 1.141.0.

## Source layout

- Branch: `madlik/main`.
- `origin`: <https://github.com/david-madlik/madlik-code-server.git>.
- `upstream`: <https://github.com/coder/code-server.git>.
- `patches/madlik-mobile.diff`: all mobile VS Code source, styles and vendored
  keyboard files, applied after the upstream patches in `patches/series`.
- `lib/vscode`: the original pinned submodule. Its working tree is intentionally
  modified while quilt patches are applied; do not commit that working tree or
  change its gitlink to publish mobile changes.
- `.madlik/`: ignored bundles, preview distribution, config/data, test workspace,
  fixtures, logs and screenshots. Do not publish its contents or credentials.

Edit patched source files, use `quilt add` for new files, and run `quilt refresh`.
Review and commit the resulting patch in the root repository. Do not edit installed
`/usr/lib/code-server` files or generated bundles. For a shallow upstream checkout,
fetch the needed upstream history before rebasing.

## Preview prerequisites

The current preview workflow targets Debian/Linux with Node.js 24, npm, Git,
quilt and a user systemd session. It stages from an installed **code-server 4.141.0**
distribution, normally `/usr/lib/code-server`; set `MADLIK_BASE_DISTRIBUTION` to
another compatible distribution directory if needed. Build dependencies must be
installed before running the preview scripts.

For a fresh checkout:

```sh
git submodule update --init --depth 1
quilt push -a
npm ci --ignore-scripts --no-audit --no-fund
npm --prefix lib/vscode ci --ignore-scripts --no-audit --no-fund
npm --prefix lib/vscode/build ci --ignore-scripts --no-audit --no-fund
bash madlik/build-preview.sh
bash madlik/start-preview.sh
```

Do not reapply patches to an already patched checkout; inspect `quilt applied`.
The preview workflow reuses native runtime dependencies from the baseline
installation. For a complete distribution build, follow the upstream
[contributing guide](docs/CONTRIBUTING.md); no portable release package is provided yet.

The build runs with a 4 GiB memory cap via user systemd and requires at least 6 GiB
available RAM, including reserve. Do not run another compiler/typechecker alongside
it. The preview is an unlocalized server-web bundle with English mobile controls.

`build-preview.sh` stages into `.madlik/runtime` and assigns a build identity derived
from the baseline and mobile patch to both server and browser products. It also
copies `LICENSE.simple-keyboard`. `start-preview.sh` uses only isolated data:

| Resource | Location |
| --- | --- |
| Listener | `127.0.0.1:18110` |
| Config | `.madlik/config.yaml` |
| User data | `.madlik/user-data` |
| Shared data | `.madlik/shared` |
| Extensions | `.madlik/extensions` |
| Test Git workspace | `.madlik/workspace` |

Workspace trust is disabled only for this isolated fixture instance. Production
configuration, working projects, authentication and network services are not changed
by these scripts. The preview has no authentication and must remain on loopback.

To access it from another computer without exposing a port publicly:

```sh
ssh -N -L 18110:127.0.0.1:18110 user@your-server
```

Open `http://localhost:18110`. If the preview was started as the transient service
`madlik-mobile-preview`, stop it with `sudo systemctl stop madlik-mobile-preview`.
A plain `start-preview.sh` process is stopped with Ctrl+C.

## Tests

After starting the isolated preview:

```sh
node lib/vscode/node_modules/playwright/cli.js install chromium
node madlik/test-mobile.mjs
node madlik/test-terminal-touch.mjs
node madlik/test-clipboard.mjs
node madlik/test-code-keyboard.mjs
```

Run suites sequentially. For repeatable raw PTY/clipboard tests, stop the preview,
archive its `.madlik/user-data` and `.madlik/shared` directories, and start with a
fresh isolated profile rather than restoring terminals from earlier browser contexts.
Preserve `User/settings.json` in the new profile. Never reset production user data.
See [TESTING.md](madlik/TESTING.md) for coverage, artifacts and device limitations.

The focused typecheck is:

```sh
lib/vscode/node_modules/.bin/tsc -p madlik/tsconfig.json --noEmit --skipLibCheck
```

Run it separately from the build, with a 4 GiB process/service memory cap. It checks
the changed production modules and their dependencies, not the entire upstream test tree.

## Updates and deployment

1. Select and fetch a concrete upstream release.
2. Integrate upstream changes and update its pinned VS Code submodule.
3. Reapply/rebase the quilt stack, especially the mobile workbench patch.
4. Review workbench internals and xterm gesture compatibility.
5. Build an isolated distribution and run the browser suites, including simultaneous
   mobile/desktop clients and real-device checks.
6. Publish/deploy only after review; retain the previous distribution for rollback.

A successful merge/build is not evidence of UI compatibility. Deployment on the
current VPS is described in [DEPLOYMENT.md](madlik/DEPLOYMENT.md); it uses a separate
release copy, not the development checkout or the installed system distribution.
