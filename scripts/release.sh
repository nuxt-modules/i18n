#!/bin/bash

set -xe

# Restore all git changes
git restore --source=HEAD --staged --worktree -- package.json pnpm-lock.yaml

# Resolve pnpm
pnpm i --frozen-lockfile=false

# Release package
echo "⚡ Publishing with tag latest"
pnpm publish --tag latest --access public --provenance --no-git-checks
