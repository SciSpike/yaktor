Event-driven, asynchronous, distributed, scalable, multi-party state-machine targeting the Node.js platform.

[![Travis status](https://img.shields.io/travis/SciSpike/yaktor/master.svg?maxAge=3600)](https://travis-ci.org/SciSpike/yaktor/builds)
[![Coveralls status](https://img.shields.io/coveralls/SciSpike/yaktor/master.svg?maxAge=3600)](https://coveralls.io/github/SciSpike/yaktor?branch=master)
[![license](https://img.shields.io/github/license/SciSpike/yaktor.svg?maxAge=3600)](https://github.com/SciSpike/yaktor/blob/master/LICENSE)
[![Gitter](https://img.shields.io/gitter/room/SciSpike/yaktor.svg?maxAge=3600)](https://gitter.im/SciSpike/yaktor)
[![npm](https://img.shields.io/npm/v/yaktor.svg?maxAge=3600)](https://www.npmjs.com/package/yaktor)

[![Yaktor Logo](http://docs.yaktor.io/images/logo-with-text.png)](http://yaktor.io)

## Initialize a new Yaktor application

To initialize a new Yaktor project, you'll want to do something like

```
$ mkdir myapp
$ cd myapp
$ curl init.yaktor.io | bash
```
which will use Docker to pull the yaktor Node.js image and create a yaktor-based application in directory `myapp`.

Then, after the command completes, execute
```
$ ./yak gen-src gen-views start
```
## The UI
After that, you can navigate to `myapp`'s UI.

### macOS
If you're on macOS, go to **http://www.myapp.yaktor** or http://localhost:8888

### Linux or Windows
* If you're on Linux or Windows, go to **http://localhost:8888** or see the console output for the IP address of the `yaktor` server and use that (like http://12.34.56.78)

## Edit

Once you're running, you can use any text editor you want to work on your application, but you might consider using our eclipse plugins, available at **eclipse update site**, **http://eclipse.yaktor.io**.
They include a yaktor DSL-aware editor for `*.yc` and `*.ydm` files that provide syntax highlighting and completion.

For more information, see [the full yaktor documentation](http://docs.yaktor.io).

> NOTE: Please report issues at https://github.com/SciSpike/yaktor-issues/issues.
