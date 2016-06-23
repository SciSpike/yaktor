#!/usr/bin/env bash
docker run -it -v ~/.npmrc:"/home/$(id -un)/.npmrc" -v "$PWD":/app -w "/app" --rm yaktor/yaktor:latest $@