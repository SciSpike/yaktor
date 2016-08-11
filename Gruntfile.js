module.exports = function (grunt) {
  'use strict'
  require('load-grunt-tasks')(grunt, {
    pattern: 'grunt-*',
    config: './package.json',
    scope: 'devDependencies'
  })
  var dir = null
  var basePath = grunt.option('basePath') || './'
  var yaktorNodeVersion = grunt.option('yaktor-node-version') || ''
  var path = require('path')
  var packageJson = require(path.resolve('package.json'))
  var rawVersion = packageJson.version.match(/^(\d+\.\d+\.\d+).*$/)[ 1 ]
  var minor = rawVersion.replace(/\.\d*$/, '')
  var tag = 'v' + rawVersion
  var newTag = 'v' + minor + '.x'
  var master = grunt.option('source-branch') || 'master'
  var yaktorNodeFiles = [ 'bin/static/docker/Dockerfile', 'README.md', '.travis.yml', 'run.sh' ]
  var config = {
    coveralls: {
      ci: {
        src: 'coverage/lcov.info'
      }
    },
    'basePath': basePath,
    'dir': dir,
    bump: {
      options: {
        files: './package.json',
        commit: true,
        commitMessage: 'Rev to v%VERSION%',
        commitFiles: [ '-a' ],
        push: true,
        pushTo: 'origin',
        'prereleaseName': 'pre',
        createTag: !grunt.option('no-tag'),
        pushTags: !grunt.option('no-tag')
      }
    },
    shell: {
      'publish': {
        command: 'npm publish'
      },
      'pull': {
        command: 'git pull'
      },
      'add-owner': {
        command: [ 'npm owner add', grunt.option('owner'), packageJson.name ].join(' ')
      },
      'create-maintenance-branch': {
        command: 'git checkout -b ' + newTag + ' ' + tag
      },
      'create-tag': {
        command: 'git tag v' + packageJson.version
      },
      'use-yaktor-node-version': {
        command: [
          '[ -n "' + yaktorNodeVersion + '" ]',
          "sed -i~ 's|yaktor/node:[0-9]*\\(\\.[0-9]*\\)\\{0,2\\}|yaktor/node:" + yaktorNodeVersion + "|' " + yaktorNodeFiles.join(' '),
          'rm ' + yaktorNodeFiles.concat('').join('~ '),
          'git commit -o -m "use yaktor/node:' + yaktorNodeVersion + '" -- ' + yaktorNodeFiles.join(' ')
        ].join('&&'),
        usage: 'Ensures all references to yaktor/node are the same version.'
      },
      'release-minor': {
        'command': [
          "[ $(git status | head -n 1 | awk '{ print $3 }') == '" + master + "' ]", // minors only from master branch
          '[ -z "$(git status -s)" ]', // no untracked files
          'git diff --cached --exit-code --no-patch', // no modified files
          'grunt bump:minor',
          'grunt shell:publish',
          'grunt shell:create-maintenance-branch',
          'grunt bump:prepatch --no-tag',
          'git checkout master',
          'grunt bump:preminor --no-tag'
        ].join('&&'),
        usage: 'Make a new release. You must do this in a clean working directory from the ' + master + ' branch.'
      },
      'release-patch': {
        'command': [
          "[[ $(git status | head -n 1 | awk '{ print $3 }') =~ ^v[0-9]+\\.[0-9]+\\.x$ ]]", // patches only from vM.m.x branches
          '[ -z "$(git status -s)" ]', // no untracked files
          'git diff --cached --exit-code --no-patch', // no modified files
          'grunt bump:patch',
          'grunt shell:publish',
          'grunt bump:prepatch --no-tag'
        ].join('&&'),
        usage: "Release a patch. You must do this in a clean working directory from a release branch, like 'v0.1.x'."
      },
      'release-pre': {
        'command': [
          '[ -z "$(git status -s)" ]', // no untracked files
          'git diff --cached --exit-code --no-patch', // no modified files
          'grunt shell:create-tag',
          'grunt shell:publish',
          'git push --tags',
          'grunt bump:prerelease --no-tag'
        ].join('&&'),
        usage: 'Release a preview. You must do this in a clean working directory in any branch.'
      }
    }
  }

  grunt.initConfig(config)

  grunt.registerTask('release-patch', 'Executes git pull bump:path and npm publish this module (requires git and npm login )', [ 'shell:pull', 'shell:release-patch' ])
  grunt.registerTask('release-minor', 'Executes git pull bump:minor and npm publish this module (requires git and npm login )', [ 'shell:pull', 'shell:release-minor' ])
  grunt.registerTask('release-pre', 'Executes git pull bump:pre and npm publish this module (requires git and npm login )', [ 'shell:pull', 'shell:release-pre' ])

  for (var s in config.shell) {
    if (config.shell[ s ].usage) {
      grunt.registerTask(s, config.shell[ s ].usage, 'shell:' + s)
    }
  }
  grunt.registerTask('help', 'Prints this help message.', function () {
    console.log('\n  Usage: grunt command ... # Issues grunt command(s).\n ')
    console.log('  A management script for running a grunt tasks.\n')
    console.log('  Commands:\n')
    var tasks = Object.keys(grunt.task._tasks).filter(function (name) {
      return name !== 'shell'
    })
    var usageMax = tasks.reduce(function (max, v) {
      return Math.max(max, v.length)
    }, 0)
    var pad = new Array(usageMax).join(' ')
    tasks.forEach(function (taskName) {
      var task = grunt.task._tasks[ taskName ]
      var name = (taskName + pad).substr(0, usageMax)
      console.log('    ' + name + '  ' + task.info)
    })
  })
  grunt.registerTask('default', 'help')
}
