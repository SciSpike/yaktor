#!/bin/sh
# should use the latest available image to validate, but not LATEST
docker run -it --rm --user node -v "$PWD":/app yaktor/node:0.39.0 $@
