'use strict'

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt, {
    pattern: 'grunt-*',
    config: './package.json',
    scope: 'devDependencies'
  })
  var dir = null
  var path = require('path')
  var fs = require('fs')
  var basePath = grunt.option('basePath') || './'
  var packageJson = require(path.resolve('package.json'))

  packageJson.bundledDependencies = Object.keys(packageJson.dependencies).filter(function (dep) {
    var pkg = require(dep + '/package.json')
    return !pkg.dist || !(/registry\.npmjs\.org/.test(pkg.dist.tarball))
  })
  fs.writeFileSync(path.resolve('package.json'), JSON.stringify(packageJson, null, 2))

  var config = {
    'basePath': basePath,
    'dir': dir,
    bump: {
      options: {
        files: './package.json',
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: [ '-a' ],
        createTag: false,
        push: true,
        pushTo: '',
        pushTags: false
      }
    },
    shell: {
      //      "migrate":{
      //        command:"yaktor migrate",
      //        usage:  "Update your app to the latest"
      //      },
      'clean': {
        usage: 'Removes all non tracked files',
        command: 'git clean -fdX -- src-gen conversation routes routes_* actions action_* doc simulators servers public views'
      },
      'gen-docs': {
        usage: 'Produces html from the adoc in ./doc',
        options: {
          execOptions: {
            cwd: './doc',
            maxBuffer: Infinity
          }
        },
        command: 'ruby buildAll.rb'
      },
      'create-views': {
        command: '$(npm bin)/yaktor-ui create'
      },
      'install-views': {
        options: {
          execOptions: {
            cwd: './views',
            maxBuffer: Infinity
          }
        },
        command: [ 'npm install', '$(npm bin)/bower install' ].join(';')
      },
      'gen-src': {
        usage: 'Produce JavaScript source files from the Yaktor DSLs',
        command: 'npm run gen-src'
      },
      'generate-views': {
        command: '$(npm bin)/yaktor-ui generate',
        'options': {
          execOptions: {
            maxBuffer: Infinity
          }
        }
      },
      'grunt-views': {
        options: {
          execOptions: {
            cwd: './views',
            maxBuffer: Infinity
          }
        },
        command: '$(npm bin)/grunt'
      },
      'publish': {
        command: 'npm publish'
      },
      'pull': {
        command: 'git pull'
      },
      'add-owner': {
        command: [ 'npm owner add', grunt.option('owner'), 'engine-ui' ].join(' ')
      },
      start: {
        usage: 'Starts the yaktor app',
        command: 'LOG_LEVEL=silly npm start'
      },
      rebuild: {
        usage: 'Rebuilds npm modules',
        command: 'npm rebuild'
      },
      install: {
        usage: 'Installs npm modules',
        command: 'npm install'
      }
    }
  }

  grunt.initConfig(config)

  for (var s in config.shell) {
    if (config.shell[ s ].usage) {
      grunt.registerTask(s, config.shell[ s ].usage, 'shell:' + s)
    }
  }

  var preTasks = [ 'shell:create-views', 'shell:install-views' ]
  var reTasks = [ 'shell:generate-views', 'shell:grunt-views' ]

  grunt.registerTask('pre-views', preTasks)
  grunt.registerTask('re-views', reTasks)
  grunt.registerTask('gen-views', 'Produces the ui located in ./views', preTasks.concat(reTasks))
  grunt.registerTask('release-patch', 'Executes git pull bump:path and npm publish this module (requires git and npm login )', [ 'pull' ].concat([ 'bump:patch', 'shell:publish' ]))
  grunt.registerTask('release-minor', 'Executes git pull bump:minor and npm publish this module (requires git and npm login )', [ 'pull' ].concat([ 'bump:minor', 'shell:publish' ]))

  grunt.registerTask('help', 'Prints this help message', function () {
    console.log('\n  Usage: yak command ... # Issues yaktor command(s)')
    console.log('\n         yak bash        # Gets a bash shell inside this container')
    console.log('\n         yak             # Prints this help message\n')
    console.log('  A management script for running a Yaktor stack.\n')
    console.log('  Commands:\n')
    var tasks = Object.keys(grunt.task._tasks).filter(function (name) {
      return name !== 'shell'
    })
    var usageMax = tasks.reduce(function (max, v) {
      return Math.max(max, v.length)
    }, 0)
    var pad = Array(usageMax).join(' ')
    tasks.forEach(function (taskName) {
      var task = grunt.task._tasks[ taskName ]
      var name = (taskName + pad).substr(0, usageMax)
      console.log('    ' + name + '  ' + task.info)
    })
  })
}
