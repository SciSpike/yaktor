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

  var registry = packageJson.config.registry
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
      'clean': {
        command: 'git clean -fdX -- src-gen conversation routes routes_* actions action_* doc simulators servers public views'
      },
      'create-views': {
        command: '$(npm bin)/engine-ui create'
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
        command: 'npm run gen-src'
      },
      'generate-views': {
        command: '$(npm bin)/engine-ui generate',
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
      'package': {
        command: 'npm pack'
      },
      'publish': {
        command: 'npm publish --registry=' + registry
      },
      'pull': {
        command: 'git pull'
      },
      'add-owner': {
        command: [ 'npm owner add', grunt.option('owner'), 'engine-ui', '--registry=' + registry ].join(' ')
      },
      start: {
        command: 'LOG_LEVEL=silly npm start'
      }
    }
  }

  grunt.initConfig(config)

  for (var s in config.shell) {
    grunt.registerTask(s, 'shell:' + s)
  }

  var preTasks = [ 'create-views', 'install-views' ]
  var reTasks = [ 'generate-views', 'grunt-views' ]

  grunt.registerTask('pre-views', preTasks)
  grunt.registerTask('re-views', reTasks)
  grunt.registerTask('gen-views', preTasks.concat(reTasks))
  grunt.registerTask('release-patch', [ 'pull' ].concat([ 'bump:patch', 'publish' ]))
  grunt.registerTask('release-minor', [ 'pull' ].concat([ 'bump:minor', 'publish' ]))
}
