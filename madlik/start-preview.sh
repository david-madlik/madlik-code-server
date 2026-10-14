#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")/.." && pwd)"
test -f "$project_root/.madlik/config.yaml"
exec node "$project_root/.madlik/runtime/out/node/entry.js" \
  --config "$project_root/.madlik/config.yaml" \
  --bind-addr 127.0.0.1:18110 \
  --user-data-dir "$project_root/.madlik/user-data" \
  --extensions-dir "$project_root/.madlik/extensions" \
  --vscode-option "shared-data-dir=$project_root/.madlik/shared" \
  --disable-workspace-trust \
  "$project_root/.madlik/workspace"
