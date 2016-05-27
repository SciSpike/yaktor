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
  var master = grunt.option('source-branch') || 'master'

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
          "[ $(git status | head -n 1 | awk '{ print $3 }') == '" + master + "' ]", // minors only from master branch
          '[ -z "$(git status -s)" ]', // no untracked files
          'git diff --cached --exit-code --no-patch', // no modified files
          'grunt bump:minor',
          'grunt shell:publish',
          'git checkout -b ' + newTag + ' ' + tag,
          'grunt bump:prepatch --no-tag',
          'git checkout master',
          'grunt bump:preminor --no-tag'
        ].join('&&'),
        help: 'Make a new release. You must do this in a clean working directory from the ' + master + ' branch.'
      },
      'release-patch': {
        'command': [
          "[[ $(git status | head -n 1 | awk '{ print $3 }') =~ ^v[0-9]+\.[0-9]+\.x$ ]]", // patches only from vM.m.x branches
          '[ -z "$(git status -s)" ]', // no untracked files
          'git diff --cached --exit-code --no-patch', // no modified files
          'grunt bump:patch',
          'grunt shell:publish',
          'grunt bump:prepatch --no-tag'
        ].join('&&'),
        help: 'Release a patch. You must do this in a clean working directory from a release branch, like \'v0.1.x\'.'
      },
      'release-pre': {
        'command': [
          '[ -z "$(git status -s)" ]', // no untracked files
          'git diff --cached --exit-code --no-patch', // no modified files
          'git tag v' + packageJson.version,
          'grunt shell:publish',
          'grunt bump:prerelease --no-tag'
        ].join('&&'),
        help: 'Release a preview. You must do this in a clean working directory in any branch.'
      }
    }
  }

  grunt.initConfig(config)

  grunt.registerTask('add-owner', [ 'shell:add-owner' ])
  grunt.registerTask('release-patch', [ 'shell:pull', 'shell:release-patch' ])
  grunt.registerTask('release-minor', [ 'shell:pull', 'shell:release-minor' ])
  grunt.registerTask('release-pre', [ 'shell:pull', 'shell:release-pre' ])
}
