#!/usr/bin/env bash
docker run -it -v ~/.npmrc:"/home/$(id -un)/.npmrc" -v "$PWD":/app --rm yaktor/yaktor:0.32.0 $@