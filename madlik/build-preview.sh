#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_root"
mkdir -p .madlik
exec 9>.madlik/build.lock
flock -n 9 || { echo 'Another Madlik preview build is running.' >&2; exit 1; }
# Native build dependencies must already be installed; see README.madlik.md.
test "$(node -p 'process.versions.node.split(".")[0]')" = 24
base_distribution="${MADLIK_BASE_DISTRIBUTION:-/usr/lib/code-server}"
test -f "$base_distribution/lib/vscode/product.json"
test -f lib/vscode/build/node_modules/esbuild/package.json
available_kb="$(awk '/MemAvailable:/ {print $2}' /proc/meminfo)"
if (( available_kb < 6291456 )); then
  echo 'Build needs at least 6 GiB available RAM (4 GiB build cap plus reserve).' >&2
  exit 1
fi
cp lib/vscode/product.json .madlik/product.before-build.json
trap 'cp .madlik/product.before-build.json lib/vscode/product.json' EXIT
cp "$base_distribution/lib/vscode/product.json" lib/vscode/product.json
cp lib/vscode/node_modules/@vscode/codicons/dist/codicon.ttf lib/vscode/src/vs/base/browser/ui/codicons/codicon/codicon.ttf
test "$(quilt top)" = patches/madlik-mobile.diff
quilt refresh
build_commit="$(node -e 'const fs=require("fs"),c=require("crypto"); console.log(c.createHash("sha256").update(fs.readFileSync("madlik/upstream.json")).update(fs.readFileSync("patches/madlik-mobile.diff")).digest("hex").slice(0,40))')"
# Run as a user transient service so a failed build cannot consume the VPS RAM.
# CPU and memory caps apply to Node and its esbuild subprocess together.
systemd-run --user --wait --pipe --collect --unit="madlik-mobile-build-$$" \
  -p MemoryMax=4G -p MemorySwapMax=0 -p CPUQuota=200% \
  -p "WorkingDirectory=$project_root/lib/vscode" \
  --setenv="PATH=$PATH" --setenv=NODE_OPTIONS=--max-old-space-size=1024 \
  --setenv="BUILD_SOURCEVERSION=$build_commit" \
  node build/next/index.ts bundle --target server-web --out out-madlik
node -e 'require("fs").writeFileSync(".madlik/build.json", JSON.stringify({commit:process.argv[1]}))' "$build_commit"
node madlik/stage-preview.mjs
