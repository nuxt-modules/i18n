#!/bin/bash

set -xe

# Restore all git changes
git restore --source=HEAD --staged --worktree -- package.json yarn.lock

# Resolve yarn
YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install

# Update token
if [[ ! -z ${NPM_TOKEN} ]] ; then
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> ~/.npmrc
  echo "registry=https://registry.npmjs.org/" >> ~/.npmrc
  echo "always-auth=true" >> ~/.npmrc
  echo "npmAuthToken: ${NPM_TOKEN}" >> ~/.yarnrc.yml
  npm whoami
fi

# Release package
echo "⚡ Publishing with tag next"
npx npm@8.17.0 publish --tag next --access public --tolerate-republish
