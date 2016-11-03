#!/usr/bin/env bash

if [ -z "$TRAVIS_NPM_AUTH_TOKEN" ]; then
  echo "No envvar TRAVIS_NPM_AUTH_TOKEN; aborting publish."
  exit 1
else
  echo "//registry.npmjs.org/:_authToken=$TRAVIS_NPM_AUTH_TOKEN" > ~/.npmrc
  chmod go-rwx ~/.npmrc
fi

# don't publish prereleases from travis
PRE=$(node -e 'var m = require("./package.json").version.match(/-pre.*$/); console.log(m ? m[0] : "")')
if [ -n "$PRE" ]; then
  echo "Prerelease version detected; not publishing"
  exit 0
fi

VERSION=$(node -e 'console.log(require("./package.json").version)')
echo "Publishing version $VERSION to npm"
set +x
echo "TODO: npm publish"
