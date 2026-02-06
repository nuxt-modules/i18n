#!/bin/bash

set -xe

# Restore all git changes
git restore --source=HEAD --staged --worktree -- package.json pnpm-lock.yaml

# Bump versions to edge
pnpm jiti ./scripts/bump-edge

# Resolve pnpm
pnpm i --frozen-lockfile=false

# Release package
echo "⚡ Publishing edge version"
pnpm publish --tag latest --access public --provenance --no-git-checks
