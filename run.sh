#!/bin/sh
# should use the latest available image to validate, but not LATEST
if [ -f .env ]; then
RUN_ENV_FILE='--env-file .env'
fi
docker run $RUN_ENV_FILE -it --rm --user node -v "$PWD":/app yaktor/node:0.39.0 $@
