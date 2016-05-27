module.exports = function (grunt) {
  'use strict'
  require('load-grunt-tasks')(grunt, {
    pattern: 'grunt-*',
    config: './package.json',
    scope: 'devDependencies'
  })
  var dir = null
  var basePath = grunt.option('basePath') || './'
  var registry = '--registry=http://npm.scispike.com'
  var path = require('path')
  var packageJson = require(path.resolve('package.json'))
  var tag = grunt.option('tag')
  var newTag = tag && tag.replace(/\.\d*$/, '.x')

  var config = {
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
        command: [ 'npm publish', registry ].join(' ')
      },
      'pull': {
        command: 'git pull'
      },
      'add-owner': {
        command: [ 'npm owner add', grunt.option('owner'), packageJson.name, registry ].join(' ')
      },
      'release-minor': {
        'command': [
          "[ $(git status | head -n 1 | awk '{ print $3 }') == 'master' ]",
          'grunt bump:minor',
          'grunt shell:publish',
          'grunt bump:preminor --no-tag'
        ].join('&&'),
        'help': 'make a new release. This must be done from the master branch.'
      },
      'release-patch': {
        'command': [
          "[[ $(git status | head -n 1 | awk '{ print $3 }') =~ ^v[0-9]+\.[0-9]+\.x$ ]]",
          'grunt bump:patch',
          'grunt shell:publish',
          'grunt bump:prepatch --no-tag'
        ].join('&&'),
        help: 'hotfix a release. You must do this from a branch named after the minor release tag like: v0.1'
      },
      'create-patch': {
        'command': [
          'git diff --exit-code',
          " [[ '" + tag + "' =~ ^v[0-9]*\.[0-9]*\.0$ ]] ",
          'git checkout -b ' + newTag + ' ' + tag,
          'grunt bump:prepatch --no-tag'
        ].join('&&'),
        help: 'create a branch to hotfix a release. You must do this in a clean working directory.'
      }
    }
  }

  grunt.initConfig(config)

  grunt.registerTask('add-owner', [ 'shell:add-owner' ])
  grunt.registerTask('release-patch', [ 'shell:pull', 'shell:release-patch' ])
  grunt.registerTask('release-minor', [ 'shell:pull', 'shell:release-minor' ])
  grunt.registerTask('create-patch', [ 'shell:create-patch' ])
}
