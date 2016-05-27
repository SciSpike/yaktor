var path = require('path')
var root_dir = path.basename(process.cwd())
require('blanket')({
  /* options are passed as an argument object to the require statement */
  'data-cover-reporter-options': {
    'basepath': process.cwd()
  },
  'data-cover-never': [ '.gen', '.def', '/types/' ],
  'pattern': [ '/' + root_dir + '/lib/', '/' + root_dir + '/conversations/' ]
})
