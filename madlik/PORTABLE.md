# Portable Linux amd64 package

This package contains the existing Madlik mobile build, Node.js and prebuilt
runtime dependencies. Installation needs no compilation, npm, Node.js download
or root access. The archive includes build identity, source revision and mobile
patch in `BUILD.json` and `source/`.

Target: Linux x86_64 (amd64) using glibc and libstdc++, such as Debian or Ubuntu.
ARM and Alpine/musl require a different build. This artifact was packaged and
tested on Debian 13; other distributions must pass the runtime check below.
Four GB RAM avoids the build requirement by using these prebuilt files; actual
memory consumption depends on extensions, terminals and projects. Allow roughly
1 GB for extraction and another 1 GB if installing a separate copy. Git and your
preferred shell should be installed on the target for normal development.

## Install on the target

Copy the `.tar.gz` and matching `.sha256` file from `release-packages/` to the
target server. Replace `ARCHIVE` below with the actual filename without `.tar.gz`:

```sh
sha256sum -c ARCHIVE.tar.gz.sha256
tar -xzf ARCHIVE.tar.gz
cd ARCHIVE
./bin/code-server --version
sh ./install.sh
"$HOME/.local/bin/madlik-code-server" --bind-addr 127.0.0.1:18110 /path/to/workspace
```

The installer defaults to `~/.local` or accepts an absolute prefix:
`sh ./install.sh /absolute/custom/prefix`. It refuses to overwrite an existing
installation or launcher. You can also run `./bin/code-server` directly from the
extracted archive without installing it. No startup service is installed.

On first normal start, upstream code-server creates its configuration at
`~/.config/code-server/config.yaml` and generates a login password. It uses normal
code-server user data; use explicit `--config`, `--user-data-dir` and
`--extensions-dir` if another installation already exists and you want separate
profiles. Existing extensions and projects are not bundled. Do not run
`npm install` or upstream `install.sh` against this archive.

The example listens on loopback only. Check port 18110 is free before starting,
or choose another port. To access from your computer, forward the chosen port:

```sh
ssh -N -L 18110:127.0.0.1:18110 user@server
```

Open `http://localhost:18110` and log in with the password from the target's
code-server configuration. HTTPS/reverse proxy, automatic startup and any custom
login portal are separate setup steps; they are not included in this package.

## Create the archive on the build host

After `bash madlik/build-preview.sh`, run:

```sh
python3 madlik/package-portable.py
```

The packager checks that the staged runtime matches the current upstream baseline
and mobile patch. It only archives distribution files; preview credentials,
profiles, workspaces, logs and screenshots are excluded. Output goes to ignored
`release-packages/`. Packaging and startup checks do not replace mobile device
testing. No release is published and no running service is changed.
