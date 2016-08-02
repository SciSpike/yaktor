# yaktor

[![Travis branch](https://img.shields.io/travis/SciSpike/yaktor/master.svg?maxAge=2592000)]()
[![Coveralls branch](https://img.shields.io/coveralls/SciSpike/yaktor/master.svg?maxAge=2592000)]()
[![license](https://img.shields.io/github/license/SciSpike/yaktor.svg?maxAge=2592000)]()
[![Gitter](https://img.shields.io/gitter/room/SciSpike/yaktor.svg?maxAge=2592000)]()
[![npm](https://img.shields.io/npm/v/yaktor.svg?maxAge=2592000)]()

DSL-based tool to produce an event-driven, asynchronous, distributed, multi-party state machine for Node.js.

## Description

[Yakor](https://github.com/Scispike/yaktor) leverages our npm modules [yaktor-lang](https://github.com/Scispike/yaktor-lang-js) and [yaktor-ui-angular1](https://github.com/Scispike/yaktor-ui-angular1) to produce an event-driven, asynchronous, distributed, multi-party state-machine in Node.js.

It is also an application generator for building an application based on yaktor.

## Usage

Typically, you'll want to do something like

```
$ mkdir myapp && cd "$_"
$ docker run -it -v "$PWD":/app --rm --entrypoint bash yaktor/base:0.34.1 -c 'npm install yaktor@latest && npm init && $(npm bin)/yaktor migrate'
```
> Note: you can add -f to `npm init` and/or  `yaktor migrate`

which will use Docker to pull the yaktor image and create a yaktor-based application in `myapp`.  Then, when the command completes,

```
$ yak gen-src gen-views start
```

After that, you can navigate to the `myapp`'s UI at `http://myapp.yaktor` (if you're on Mac with `docker-machine` installed, you'll have to use the IP address instead of `myapp.yaktor` that's echoed to the terminal when `yak start` runs).

## Edit

Once you're running, you can use any text editor you want to work on your application, but you might consider using our eclipse plugins, available at eclipse update site http://yaktor.io/eclipse.  They include a yaktor DSL-aware editor for `*.cl` and `*.dm` files that provide syntax highlighting and completion.

For more information, see the full yaktor documentation.
