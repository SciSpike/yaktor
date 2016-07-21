#!/bin/sh
docker run -it -v "$PWD":/app --rm yaktor/yaktor:0.32.0 $@