This module supports the conversation DSL to produce a event-driven asynchronous distributed multi-party state-machine in Node.js.


## create docker image

```
docker build -t yaktor:$(node -e 'console.log(require("./package.json").version.replace(/-pre.*/,""));') --build-arg UID=$(id -u) --build-arg USER=$(id -un) docker
```

## Build and Test

`run.sh` is a shortcut to typing `docker run -it -v "$PWD":/app -w "/app" --rm yactor-app`

`./run.sh` will invoke bash by default, but the contianer lacks commands for hardcore editing.

So you should edit in the host using what ever you like.

Then you can:

```
./run.sh npm login # only need to do this once 
./run.sh npm run gen-src
./run.sh npm test
```