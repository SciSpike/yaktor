#!/usr/bin/env node
process.on('uncaughtException', function (err) {
  console.log(new Error(err.stack + '\nRethrown:').stack)
})

var argv = require('commander')
var path = require('path')
var async = require('async')
var util = require('util')
var fs = require('fs-extra')
var childProcess = require('child_process')
var os = require('os')
var which = require('which')
var semver = require('semver')

var dir = process.cwd()

var cpFiles = function (dir, destDir, force, cb) {
  console.log('recursively copying: %s -> %s', dir, destDir)
  fs.copy(dir, destDir, { clobber: force }, cb)
}

var packageFile = path.join(__dirname, '../package.json')
var packageJson = require(packageFile)

var shared = function (appDir, force) {
  var processFiles = function (cb) {
    var currentPackageJson = require('./package.json')

    // Read this file first. It will throw if you are in an empty dir (which is on
    // purpose).
    var theirPackageJson = require(path.join(appDir, 'package.json'))

    var staticPath = path.join(__dirname, 'static')

    // Update dependencies
    // merge taking theirs

    ;[ 'dependencies', 'devDependencies', 'scripts', 'config' ].forEach(function (m) {
      // merge taking theirs
      theirPackageJson[ m ] = theirPackageJson[ m ] || {}
      if (!force) {
        util._extend(currentPackageJson[ m ], theirPackageJson[ m ])
      }
      util._extend(theirPackageJson[ m ], currentPackageJson[ m ])
    })

    // pwn subsection

    ;[ { sub: 'devDependencies', name: 'yaktor-lang' } ].forEach(function (d) {
      theirPackageJson[ d.sub ][ d.name ] = packageJson[ d.sub ][ d.name ]
    })

    theirPackageJson.dependencies.yaktor = packageJson.version

    fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(theirPackageJson, null, 2))

    async.parallel([ function (done) {
      cpFiles(path.join(staticPath, 'lib'), path.join(appDir, 'lib'), true, done)
    }, function (done) {
      cpFiles(path.join(staticPath, 'config'), path.join(appDir, 'config'), true, done)
    }, function (done) {
      cpFiles(path.join(staticPath, 'public'), path.join(appDir, 'public'), true, done)
    }, function (done) {
      cpFiles(path.join(staticPath, 'docker'), path.join(appDir, 'docker'), force, done)
    }, function (done) {
      cpFiles(path.join(staticPath, 'test'), path.join(appDir, 'test'), force, done)
    }, function (done) {
      async.series([ function (next) {
        cpFiles(path.join(staticPath, 'ROOT'), path.join(appDir), force, next)
      }, function (next) {
        fs.move(path.join(appDir, 'demo.cl.example'), path.join(appDir, 'demo.cl'), { clobber: force }, next)
      } ], done)
    } ], cb)
  }

  if (packageJson._resolved && packageJson._resolved.indexOf('file:') === 0) { // then assume you're developing yaktor itself
    console.log('NOTE: local development of yaktor detected; installing yaktor from ' + path.resolve(__dirname, '..'))
    async.series([
      async.apply(processFiles),
      async.apply(exec, 'npm', [ 'install', path.resolve(__dirname, '..') ]), // install this very yaktor
      function (next) {
        var yaktorLangRequiredVersion = packageJson.devDependencies[ 'yaktor-lang' ]
        console.log('INFO: trying to install required yaktor-lang@%s', yaktorLangRequiredVersion)

        exec('npm', [ 'install', 'yaktor-lang@' + yaktorLangRequiredVersion ], function (err) {
          if (!err) return next()

          // else try to install from location next to this very yaktor
          var yaktorLangDir = path.resolve(__dirname, '..', 'yaktor-dsl-xtext', 'target', 'npm')
          if (fs.existsSync(yaktorLangDir) &&
            semver.satisfies(require(path.resolve(path.join(yaktorLangDir, 'package.json'))).version, yaktorLangRequiredVersion)) {
            console.log('WARNING: ignore previous error; installing yaktor-lang@%s instead from directory %s', yaktorLangRequiredVersion, yaktorLangDir)
            exec('npm', [ 'install', yaktorLangDir ], next)
          } else {
            next(new Error('No yaktor-lang found that satisfies version requirement of ' + yaktorLangRequiredVersion))
          }
        })
      },
      async.apply(exec, 'npm', [ 'install' ])
    ], function (err) {
      if (err) {
        console.log(err.stack)
        process.exit(1)
      } else {
        process.exit(0)
      }
    })
  } else {
    async.series([
      async.apply(processFiles),
      async.apply(exec, 'npm', [ 'install' ])
    ], function (err) {
      if (err) {
        console.log(err.stack)
        process.exit(1)
      } else {
        process.exit(0)
      }
    })
  }
}

function createRootFiles (name, appDir, options) {
  var gitignore = [
    '*.def.js',
    '*.gen.js',
    '/conversations/types',
    '/conversations/ejs',
    '/conversations/security',
    '/actions',
    '/coverage',
    '/doc',
    '/public/*',
    '!/public/socketApi.js',
    '/routes',
    '/servers',
    '/simulator',
    '/src-gen',
    'node_modules',
    'bower_components'
  ].join(os.EOL)

  var dotProject = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<projectDescription>',
    '  <name>' + name + '</name>',
    '  <comment></comment>',
    '  <projects>',
    '  </projects>',
    '  <buildSpec>',
    '    <buildCommand>',
    '      <name>org.eclipse.xtext.ui.shared.xtextBuilder</name>',
    '      <arguments>',
    '      </arguments>',
    '    </buildCommand>',
    '  </buildSpec>',
    '  <natures>',
    '    <nature>org.eclipse.xtext.ui.shared.xtextNature</nature>',
    '  </natures>',
    '</projectDescription>'
  ].join(os.EOL)

  var files = {
    '.project': dotProject,
    '.gitignore': gitignore,
    '.npmignore': ''
  }
  Object.keys(files).forEach(function (file) {
    var pathname = path.join(appDir, file)
    if (fs.existsSync(pathname) && options.safe) {
      console.error('File ' + pathname + ' exists: failing.')
      return process.exit(-1)
    }

    fs.writeFileSync(pathname, files[ file ])
  })
}

function init (appDir, options) {
  appDir = path.resolve(appDir || dir)
  console.log('yaktorizing %s', appDir)
  process.chdir(appDir)
  var theirPackageJson = path.join(appDir, 'package.json')
  var theirJson
  if (fs.existsSync(theirPackageJson)) {
    if (options.safe) {
      console.error('File ' + theirPackageJson + ' exists.  Failing.')
      process.exit(-1)
    }
    theirJson = require(theirPackageJson)
  } else {
    theirJson = {
      private: true
    }
  }
  theirJson.version = options.initialVersion
  theirJson.dependencies = theirJson.dependencies || {}
  theirJson.devDependencies = theirJson.devDependencies || {}
  theirJson.scripts = theirJson.scripts || {}

  fs.writeFileSync(theirPackageJson, JSON.stringify(theirJson, null, 2))
  if (!options.noNpmInit) {
    childProcess.execSync('npm init -y', { stdio: 'inherit' })
  }
  createRootFiles(options.name || path.basename(appDir), appDir, options)
  shared(appDir, !options.safe)
}

function create (name, options) {
  var appDir = path.resolve(dir, name)
  if (fs.existsSync(appDir)) {
    if (options.safe) {
      console.error('Directory "%s" already exists: failing.', name)
      return process.exit(-1)
    }
  } else {
    fs.mkdirSync(appDir)
  }
  process.chdir(appDir)
  console.log('create %s %s using yaktor@%s', name, options.initialVersion, packageJson.version)
  options.name = name
  init(appDir, options)
}

argv.command('cassandra')
  .description('add cassandra support and logging')
  .action(function () {
    var staticPath = path.join(__dirname, 'cassandra')

    var theirPackageJson = require(path.join(path.resolve('package.json')))
    var currentPackageJson = require('./cassandra-package.json')
    util._extend(theirPackageJson.dependencies, currentPackageJson.dependencies)
    cpFiles(path.join(staticPath, 'config'), path.join(dir, 'config'), true)
    exec('npm', [ 'install' ])
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(theirPackageJson, null, 2))
  })

argv.command('init [path]')
  .description('initialize yaktor app at [path] to current yaktor version')
  .option('-s, --safe', 'do not force initialization if files already exist')
  .option('-x, --no-npm-init', 'do not run `npm init` even if necessary')
  .option('-i, --initial-version [version]', 'initial version for the created app', '0.0.1')
  .option('-x, --no-install', 'do not perform `npm install`')
  .action(init)

argv.command('create <appName>')
  .description('create a yaktor app in a new directory named <appName>')
  .option('-s, --safe', 'do not force initialization if files already exist')
  .option('-i, --initial-version [version]', 'initial version for the created app', '0.0.1')
  .option('-x, --no-install', 'do not perform `npm install`')
  .action(create)

argv.command('help [subCommand]')
  .description('alias to [subCommand] -h')
  .action(function (subCommand) {
    if (subCommand) {
      childProcess.fork(__filename, [ subCommand, '-h' ])
    } else {
      childProcess.fork(__filename, [ '-h' ])
    }
  })

argv.command('version')
  .description('show version')
  .action(function () {
    console.log(packageJson.version)
    process.exit(0)
  })

argv.parse(process.argv)

function exec (cmd, args, cb) {
  console.log([ cmd ].concat(args).join(' '))
  var p = childProcess.spawn(which.sync(cmd), args || [], { stdio: 'inherit' })
  if (cb) {
    p.on('close', cb)
  }
  return p
}
