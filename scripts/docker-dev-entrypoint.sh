#!/bin/sh
set -eu

cd /app

expected_hash="$(sha256sum package-lock.json | cut -d ' ' -f1)"
installed_hash=""

if [ -f node_modules/.motionslides-lock-hash ]; then
  installed_hash="$(cat node_modules/.motionslides-lock-hash)"
fi

if [ "$installed_hash" != "$expected_hash" ]; then
  echo "Dependency lockfile changed; refreshing the web workspace installation..."
  npm ci \
    --workspace=@motionslides/web \
    --workspace=@motionslides/shared
  printf '%s\n' "$expected_hash" > node_modules/.motionslides-lock-hash
fi

cd /app/apps/web
exec npm run dev -- --host 0.0.0.0
