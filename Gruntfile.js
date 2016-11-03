module.exports = function (grunt) {
  'use strict'
  require('load-grunt-tasks')(grunt, {
    pattern: 'grunt-*',
    config: './package.json',
    scope: 'devDependencies'
  })

  var skipBuild = grunt.option('skip-build') // helpful when testing the release process
  var dir = null
  var basePath = grunt.option('basePath') || './'
  var packageJson = grunt.file.readJSON('package.json')
  var versions = packageJson.version.match(/^(\d+)\.(\d+)\.(\d+)(\-pre\.(\d+))?$/)
  var major = versions[ 1 ]
  var minor = versions[ 2 ]
  var patch = versions[ 3 ]
  var preVersion = packageJson.version
  var patchVersion = [ major, minor, patch ].join('.')
  var minorVersion = [ major, minor ].join('.')
  var tagPrefix = 'v'
  var preTag = tagPrefix + preVersion
  var patchTag = tagPrefix + patchVersion
  var minorTag = tagPrefix + minorVersion
  var latestTag = 'latest'
  var maintenanceBranch = 'v' + minorVersion + '.x'
  var origin = grunt.option('remote') || 'origin'
  var master = grunt.option('source-branch') || 'master'

  var releaseMinor = [
    'shell:confirmOnMasterBranch',
    'shell:confirmNoUntrackedFiles',
    'shell:confirmNoModifiedFiles',
    'gitfetch:tags',
    'gitpull:origin',
    'bump:minor',
    'shell:ci',
    'gitadd:all',
    'gitcommit:releaseMinor',
    'gittag:patch',
    'gitcheckout:maintenance',
    'bump:prepatch',
    'gitadd:all',
    'gitcommit:vnext',
    'gitpush:maintenance',
    'gitcheckout:master',
    'bump:preminor',
    'gitadd:all',
    'gitcommit:vnext',
    'gitpush:master',
    'gitpush:patchTag'
  ]

  var releasePatch = [
    'shell:confirmOnMaintenanceBranch',
    'shell:confirmNoUntrackedFiles',
    'shell:confirmNoModifiedFiles',
    'gitfetch:tags',
    'gitpull:origin',
    'bump:patch',
    'shell:ci',
    'gitadd:all',
    'gitcommit:releasePatch',
    'gittag:patch',
    'bump:prepatch',
    'gitadd:all',
    'gitcommit:vnext',
    'gitpush:maintenance',
    'gitpush:patchTag'
  ]

  var config = {
    pkg: packageJson,
    basePath: basePath,
    dir: dir,
    bump: {
      options: {
        files: './package.json',
        commit: false,
        push: false,
        pushTo: origin,
        prereleaseName: 'pre',
        createTag: false,
        pushTags: false
      }
    },
    gitpush: {
      master: { options: { remote: origin, branch: master } },
      maintenance: { options: { remote: origin, branch: maintenanceBranch, upstream: true } },
      current: { options: { remote: origin } },
      preTag: { options: { remote: origin, branch: preTag } },
      patchTag: { options: { remote: origin, branch: patchTag } },
      minorTag: { options: { remote: origin, branch: minorTag, force: true } },
      latestTag: { options: { remote: origin, branch: latestTag, force: true } }
    },
    gittag: {
      pre: { options: { tag: preTag } },
      patch: { options: { tag: patchTag } },
      minor: { options: { tag: minorTag, force: true } },
      latest: { options: { tag: latestTag, force: true } }
    },
    gitpull: {
      origin: { options: { remote: origin } }
    },
    gitfetch: {
      tags: { options: { remote: origin, tags: true } }
    },
    gitcheckout: {
      master: { options: { branch: master } },
      maintenance: { options: { branch: maintenanceBranch, create: true } }
    },
    gitadd: {
      all: { options: { all: true } }
    },
    gitcommit: {
      releaseMinor: { options: { message: 'release ' + patchTag } },
      releasePatch: { options: { message: 'release ' + patchTag } },
      vnext: { options: { message: 'prepare for next dev iteration' } }
    },
    shell: {
      confirmOnMasterBranch: {
        command: "[ $(git status | head -n 1 | awk '{ print $3 }') == '" + master + "' ]"
      },
      confirmOnMaintenanceBranch: {
        command: "[[ $(git status | head -n 1 | awk '{ print $3 }') =~ ^v[0-9]+\\.[0-9]+\\.x$ ]]"
      },
      confirmNoUntrackedFiles: {
        command: '[ -z "$(git status -s)" ]'
      },
      confirmNoModifiedFiles: {
        command: 'git diff --cached --exit-code --no-patch'
      },
      ci: {
        command: skipBuild
          ? 'echo "Skipping build because --skip-build=' + skipBuild + '"'
          : "./run.sh npm run ci"
      }
    }
  }

  grunt.initConfig(config)

  grunt.registerTask('release-patch', 'Creates patch-level tag & advances minor tag, and, optionally, the latest tag', releasePatch)
  grunt.registerTask('release-minor', 'Creates maintenance branch, patch- & minor-level tags, and advances latest tag', releaseMinor)

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
}
