[![Yakor Logo](http://yaktor.io/pics/yaktor-logo.png)](https://github.com/Scispike/yaktor)

  Event-driven, asynchronous, distributed, multi-party state-machine targeting the Node.js platform.

[![Travis status](https://img.shields.io/travis/SciSpike/yaktor/master.svg?maxAge=3600)](https://travis-ci.org/SciSpike/yaktor/builds)
[![Coveralls status](https://img.shields.io/coveralls/SciSpike/yaktor/master.svg?maxAge=3600)](https://coveralls.io/github/SciSpike/yaktor?branch=master)
[![license](https://img.shields.io/github/license/SciSpike/yaktor.svg?maxAge=3600)](https://github.com/SciSpike/yaktor/blob/master/LICENSE)
[![Gitter](https://img.shields.io/gitter/room/SciSpike/yaktor.svg?maxAge=3600)](https://gitter.im/SciSpike/yaktor)
[![npm](https://img.shields.io/npm/v/yaktor.svg?maxAge=3600)](https://www.npmjs.com/package/yaktor)

Leverages our npm modules [yaktor-lang](https://github.com/SciSpike/yaktor-dsl-xtext/tree/master/cli) and [yaktor-ui-angular1](https://github.com/Scispike/yaktor-ui-angular1).

## Usage

Typically, you'll want to do something like

```
$ mkdir myapp
$ cd myapp
$ docker run -it -v "$PWD":/app --rm --entrypoint bash yaktor/node:0.39.0 \
    -c 'npm install yaktor && $(npm bin)/yaktor init'
```

which will use Docker to pull the yaktor Node.js image and create a yaktor-based application in `myapp`.  Then, when the command completes,

```
$ ./yak gen-src gen-views start
```

After that, you can navigate to the `myapp`'s UI at [`http://myapp.yaktor`](http://myapp.yaktor).

> Note: If you're on Mac with `docker-machine` installed, you'll have to use the IP address instead of `myapp.yaktor` that's echoed to the terminal when `yak start` runs.

## Edit

Once you're running, you can use any text editor you want to work on your application, but you might consider using our eclipse plugins, available at eclipse update site http://yaktor.io/eclipse.  They include a yaktor DSL-aware editor for `*.cl` and `*.dm` files that provide syntax highlighting and completion.

For more information, see the full yaktor documentation.
