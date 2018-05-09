#!/usr/bin/env sh

# abort on errors
set -e

# set root dir to working directory
MODULE_ROOT=`pwd`

# build
yarn docs:build

# navigate into the build output directory
cd docs/.vuepress/dist

# copy CircleCI config
cp -r $MODULE_ROOT/.circleci ./

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io
# git push -f git@github.com:<USERNAME>/<USERNAME>.github.io.git master

# if you are deploying to https://<USERNAME>.github.io/<REPO>
git push -f git@github.com:nuxt-community/nuxt-i18n.git master:gh-pages

cd -
