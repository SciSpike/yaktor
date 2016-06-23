[Yakor](https://github.com/Scispike/yaktor) module leverages [yaktor-lang](https://github.com/Scispike/yaktor-lang-js) and [yaktor-ui](https://github.com/Scispike/yaktor-ui-angular1) to produce a event-driven asynchronous distributed multi-party state-machine in Node.js.

## Build and Test

`run.sh` is a shortcut to typing `docker run -it -v "$PWD":/app -w --rm yactor/yaktor`

`./run.sh` will invoke bash by default, but the container lacks commands for hard core editing.

So you should edit in the host using what ever you like.

Then you can:

```
./run.sh npm install 
./run.sh npm run gen-src
./run.sh npm test
```