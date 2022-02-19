#!/bin/bash

set -xe

# Restore all git changes
git restore -s@ -SW  -- packages

# Bump versions to edge
yarn jiti ./scripts/bump-edge

# Resolve yarn
YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install

# Release packages
for p in packages/* ; do
  pushd $p
  echo "Publishing $p"
  yarn npm publish --access public --tolerate-republish
  popd
done
