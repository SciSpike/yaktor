#!/bin/sh
set -ex

PREVDIR="$PWD"
WORKDIR="${WORKDIR:-$(mktemp -d -t docker-yaktor.XXXXXX)}"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

if [ -n "$(echo -n "$YAKTOR_VERSION" | egrep '\-pre.*$')" ]; then
  echo "yaktor version '$YAKTOR_VERSION' is a prerelease -- can't determine which branch to checkout; failing." >&2
  exit 1
fi

git init
git config user.email "yaktor@scispike.com"
git config user.name "Yaktor"
set +x
echo "git remote add origin https://GITHUB_TOKEN@github.com/SciSpike/docker-yaktor.git"
git remote add origin https://${GITHUB_TOKEN}@github.com/SciSpike/docker-yaktor.git
set -x
npm install semver
YAKTOR_MAJOR=$(node -e "console.log(require('semver').major('$YAKTOR_VERSION'))")
YAKTOR_MINOR=$(node -e "console.log(require('semver').minor('$YAKTOR_VERSION'))")
YAKTOR_PATCH=$(node -e "console.log(require('semver').patch('$YAKTOR_VERSION'))")

# see if we need to checkout master or a maintenance branch
if [ "$YAKTOR_PATCH" == "0" ]; then
  LEVEL=minor
  BRANCH=master
else
  LEVEL=patch
  BRANCH=v$YAKTOR_MAJOR.$YAKTOR_MINOR.x
  git checkout -b $BRANCH
fi

git pull origin $BRANCH

THIS_VERSION=$(node -e "console.log(require('./package.json').version)")
THIS_MAJOR=$(node -e "console.log(require('semver').major('$THIS_VERSION'))")
THIS_MINOR=$(node -e "console.log(require('semver').minor('$THIS_VERSION'))")
THIS_PATCH=$(node -e "console.log(require('semver').patch('$THIS_VERSION'))")
THIS_PRE=$(node -e "var pre = require('semver').prerelease('$THIS_VERSION'); console.log(pre ? ('-' + pre.join('.')) : '')")

# yaktor version i.j.k requires this version i.j.k-pre.n in order to be considered "synchronized"
# first, check the -pre.n suffix
if [ -z "$THIS_PRE" ]; then
  echo "this docker-yaktor version '$THIS_VERSION' expected to be a prerelease version; failing." >&2
  exit 2
fi
# now check that i.j.k versions jibe
if [ \
    "$THIS_MAJOR" != "$YAKTOR_MAJOR" -o \
    "$THIS_MINOR" != "$YAKTOR_MINOR" -o \
    "$THIS_PATCH" != "$YAKTOR_PATCH" ]; then
  echo "this docker-yaktor major.minor.patch version '$THIS_MAJOR.$THIS_MINOR.$THIS_PATCH' fails to match yaktor version '$YAKTOR_VERSION'; failing." >&2
  exit 3
fi

# if we get this far, versions are synchronized & we're on the correct branch; fire in the hole...

sed -i~ -r 's,yaktor@[0-9]+\.[0-9]+\.[0-9]+,yaktor@'$YAKTOR_VERSION',gm' Dockerfile
git add Dockerfile
git commit -m "sync to yaktor@$YAKTOR_VERSION"

npm install
$(npm bin)/grunt release-$LEVEL

cd "$PREVDIR"
