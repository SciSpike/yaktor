#!/usr/bin/env bash

# Ensures current user is the owner of /app's files
APP_UID=$(id -u)
FILE_OWNER_UID=$(stat -c '%u' /app/package.json)
USER=$(id -un)
if [ ! $APP_UID == $FILE_OWNER_UID ]; then
  echo "Changing ${USER}'s uid from $APP_UID to $FILE_OWNER_UID"
  sudo usermod -u $FILE_OWNER_UID $USER
fi

# Keeps container running
echo sleeping: use ./node_modules/.bin/yak to run commands
sleep infinity
