#!/bin/sh
# Run from an extracted portable package. No root or network access needed.
set -eu
package_root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
prefix=${1:-"$HOME/.local"}
case "$prefix" in
  /*) ;;
  *) echo 'Installation prefix must be an absolute path.' >&2; exit 1 ;;
esac
if [ "$(uname -s)" != Linux ] || [ "$(uname -m)" != x86_64 ]; then
  echo 'This package requires Linux x86_64 (amd64) with glibc.' >&2
  exit 1
fi
# Fail before installing if the bundled runtime cannot run on this system.
"$package_root/bin/code-server" --config /dev/null --version
release_name=$(basename -- "$package_root")
destination="$prefix/opt/$release_name"
launcher="$prefix/bin/madlik-code-server"
if [ -e "$destination" ] || [ -L "$destination" ] || [ -e "$launcher" ] || [ -L "$launcher" ]; then
  echo "Destination or launcher already exists; choose another prefix: $prefix" >&2
  exit 1
fi
mkdir -p -- "$prefix/opt" "$prefix/bin"
cp -R -- "$package_root" "$destination"
ln -s -- "$destination/bin/code-server" "$launcher"
printf '\nInstalled: %s\nRun: %s --bind-addr 127.0.0.1:18110 /path/to/workspace\n' "$destination" "$launcher"
printf 'Configuration, user data and services have not been created or changed.\n'
