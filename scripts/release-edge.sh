#!/bin/bash

set -xe

# Restore all git changes
git restore --source=HEAD --staged --worktree -- package.json yarn.lock packages

# Bump versions to edge
yarn jiti ./scripts/bump-edge

# Resolve yarn
YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install

# Update token
if [[ ! -z ${NPM_TOKEN} ]] ; then
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> ~/.npmrc
  echo "registry=https://registry.npmjs.org/" >> ~/.npmrc
  echo "always-auth=true" >> ~/.npmrc
  npm whoami
fi

# Release packages
for p in packages/* ; do
  pushd $p
  echo "Publishing $p"
  npm publish --access public
  popd
done
