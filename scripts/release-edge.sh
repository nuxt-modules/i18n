#!/bin/bash

set -xe

# Restore all git changes
git restore --source=HEAD --staged --worktree -- package.json pnpm-lock.yaml

# Bump versions to edge
pnpm jiti ./scripts/bump-edge

# Resolve pnpm
pnpm i --frozen-lockfile=false

# Update token
if [[ ! -z ${NPM_TOKEN} ]] ; then
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> ~/.npmrc
  echo "registry=https://registry.npmjs.org/" >> ~/.npmrc
  echo "always-auth=true" >> ~/.npmrc
  npm whoami
fi

# Release package
echo "⚡ Publishing edge version"
npx npm@8.17.0 publish --access public --tolerate-republish
