var async = require('async')
var SALT_WORK_FACTOR = 10
var optional = function (module) {
  try {
    return require(module)
  } catch (e) {}
}
var path = require('path')
var mongoose = require(path.resolve('node_modules', 'mongoose'))
var bcrypt = optional(path.resolve('node_modules', 'bcrypt'))

var compile = function (type) {
  var populate = type.populate = []
  type.hasNested = false
  async.each(type.fields, function (field, cb) {
    if (field.type && field.type.typeName && field.typeName !== 'TypeField') {
      type.hasNested = true
      populate.push({
        path: field.domainName,
        model: field.type.typeName,
        select: field.type.fields.join(' ')
      })
      compile(field.type)
      cb()
    }
  })
}
var converter = module.exports = {
  obscure: function (data, cb) {
    return bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
      if (err) return cb(err)
      bcrypt.hash(data, salt, cb)
    })
  },
  Type: function Type (typeName, fields, options) {
    this.typeName = typeName
    this.fields = fields
    this.hasId = options.hasId
    this.keys = options.keys
    this.discriminator = options.discriminator
  },
  Field: function Field (dtoName, domainName, typeName, type, meta) {
    this.typeName = typeName
    this.dtoName = dtoName
    this.domainName = domainName
    this.type = type
    this.meta = meta || {}
    this.toString = function () {
      return domainName
    }
    this.valueToDto = function (data, cb) {
      switch (typeName) {
        case 'AssociationEnd':
        case 'EntityReferenceField':
        case 'TypeField':
          if (data == null) {
            return cb(null, null)
          } else if (data._id) {
            return cb(null, data._id)
          } else {
            return cb(null, data)
          }
        default:
          if (meta && meta.obscured) {
            return cb(null, null)
          }
          return cb(null, data)
      }
    }
    this.valueFromDto = function (data, cb) {
      // only set if data present (you are changing it).
      if (this.meta.obscured && data) {
        return converter.obscure(data, cb)
      }
      var dateParse = function (data) {
        if (data instanceof Date) {
          return data
        } else if (typeof data === 'string') {
          return new Date(data)
        }
        return data
      }
      var mParseInt = function (v) {
        return parseInt(v)
      }
      switch (typeName) {
        case 'BooleanField':
          var i = parseInt(data)
          if (!data) {
            return cb(null, false)
          } else if (!isNaN(i)) {
            return cb(null, !!i)
          } else {
            var b = data.toString().toLowerCase() === 'true'
            return cb(null, b)
          }
        case 'DateField':
          if (Array.isArray(data)) {
            return cb(null, data.map(dateParse))
          } else {
            return cb(null, dateParse(data))
          }
        case 'NumericField':
        case 'PriceField':
        case 'Amountield':
          if (Array.isArray(data)) {
            return cb(null, data.map(parseFloat))
          } else if (isNaN(data)) {
            return cb(null, parseFloat(data))
          } else {
            return cb(null, data)
          }
        case 'IntegerField':
        case 'CountField':
          if (Array.isArray(data)) {
            return cb(null, data.map(mParseInt))
          } else if (isNaN(data)) {
            return cb(null, parseInt(data))
          } else {
            return cb(null, data)
          }
        case 'AssociationEnd':
        case 'EntityReferenceField':
          if (data == null) {
            return cb(null, null)
          } else if (data._id) {
            return cb(null, data._id)
          } else {
            return cb(null, data)
          }
      }
      return cb(null, data)
    }
    this.queryFrom = function (value, cb) {
      var that = this
      // eslint-disable-next-line handle-callback-err
      this.valueFromDto(value, function (err, value) {
        if ((that.typeName === 'StringField' || that.typeName === 'ShortIdField' ||
          ((that.typeName === 'AssociationEnd' || that.typeName === 'EntityReferenceField') && !that.type)) && value.match && value.match(/^\/.*\/$/)) {
          cb(null, new RegExp(value.substr(1, value.length - 2)))
        } else {
          cb(null, value)
        }
      })
    }
  },
  types: {},
  toDto: function (typeName, domain, callback) {
    converter.doToDto(converter.types[ typeName ], domain, callback)
  },
  fromDto: function (typeName, dto, callback) {
    converter.doFromDto(converter.types[ typeName ], dto, callback)
  },
  toQuery: function (typeName, dto, callback) {
    converter.doToQuery(converter.types[ typeName ], dto, {}, '', callback)
  },
  doToDto: function (type, domain, callback) {
    if (domain == null) {
      return callback()
    }
    if (type == null) {
      return callback(null, domain)
    }
    if (type.hasNested) {
      return mongoose.model(type.typeName).populate(domain, type.populate, function (err, domain) {
        if (err) {
          callback(err)
        } else {
          converter.doToDtoPossiblyArray(type, domain, callback)
        }
      })
    } else {
      return converter.doToDtoPossiblyArray(type, domain, callback)
    }
  },
  doFromDto: function (type, dto, callback) {
    if (dto instanceof Array) {
      return async.mapSeries(dto, function (elem, cb) {
        converter.doFromDtoSingle(type, elem, cb)
      }, callback)
    } else {
      return converter.doFromDtoSingle(type, dto, callback)
    }
  },
  doToQuery: function (type, dto, query, path, callback) {
    if (dto instanceof Array) {
      var index = 0
      return async.mapSeries(dto, function (elem, cb) {
        // XXX adding and removing the .index is probably going to confuse people
        converter.doToQuerySingle(type, elem, query, path + ((dto.length > 1) ? '.' + (index++) + '.' : '.'), cb)
      }, function (err) {
        callback(err, query)
      })
    } else {
      return converter.doToQuerySingle(type, dto, query, path, function (err) {
        callback(err, query)
      })
    }
  },
  doFromDtoSingle: function (type, dto, callback) {
    if (dto == null) {
      return callback(null, null)
    }
    // any type!?
    if (!type) {
      return callback(null, dto)
    }
    var domain = type.typeName ? new (mongoose.models[ type.typeName ])() : {}
    if (dto._id) {
      domain._id = dto._id
    }
    return async.each(type.fields, function (field, cb) {
      var value = dto[ field.dtoName ]
      if (field.meta.obscured && value == null) {
        delete domain[ field.domainName ]
        return cb()
      } else if (field.type) {
        if (typeof value === 'object' && !(value instanceof mongoose.Types.ObjectId)) {
          converter.doFromDto(field.type, value, function (err, data) {
            domain[ field.domainName ] = data
            return cb(err)
          })
        } else {
          domain[ field.domainName ] = value
          cb()
        }
      } else if (value !== undefined) {
        return field.valueFromDto(value, function (err, value) {
          domain[ field.domainName ] = value
          return cb(err)
        })
      } else {
        cb()
      }
    }, function (err) {
      return callback(err, domain)
    })
  },
  doToQuerySingle: function (type, dto, query, path, callback) {
    if (dto == null) {
      return callback(null, query)
    } else if (type != null) {
      if (dto._id && path.length) {
        query[ path.replace(/\.$/, '') ] = dto._id
      } else if (dto._id) {
        query._id = dto._id
      }
      return async.each(type.fields, function (field, cb) {
        var value = dto[ field.dtoName ]
        var name = type.keys[ field.domainName ] ? '_id' : field.domainName
        var nestType = field.type
        var fields = typeof value === 'object' ? Object.keys(value).join(',') : ''
        if (fields.match(/(^\$)|(,\$)/)) {
          query[ path + name ] = value
          return cb()
        } else if (value instanceof Array && nestType) {
          converter.doToQuery(nestType, value, query, path + name, function (err) {
            return cb(err)
          })
        } else {
          if (typeof value === 'object' && nestType) {
            return converter.doToQuerySingle(nestType, value, query, path + name + '.', function (err) {
              return cb(err)
            })
          } else if (value != null) {
            return field.queryFrom(value, function (err, value) {
              query[ path + name ] = value
              return cb(err)
            })
          }
          return cb()
        }
      }, function (err) {
        return callback(err, query)
      })
    } else {
      callback()
    }
  },
  doToDtoPossiblyArray: function (type, domains, callback) {
    if (domains instanceof Array) {
      var dtos = []
      return async.eachSeries(domains, function (domain, cb) {
        converter.doToDtoSingle(type, domain, function (err, data) {
          dtos.push(data)
          return cb(err)
        })
      }, function (err) {
        return callback(err, dtos)
      })
    } else {
      return converter.doToDtoSingle(type, domains, callback)
    }
  },
  doToDtoSingle: function (type, domain, callback) {
    var dto = {}
    var fields = type.fields
    if (domain == null) {
      return callback(null)
    }
    if (domain._id) {
      dto._id = domain._id
    }
    if (domain.__t) {
      dto.__t = domain.__t
    }
    return async.each(fields, function (field, cb) {
      var fieldData = domain[ field.domainName ]
      if (field.type) {
        converter.doToDto(field.type, fieldData, function (err, data) {
          dto[ field.dtoName ] = data
          return cb(err)
        })
      } else {
        return field.valueToDto(fieldData, function (err, value) {
          dto[ field.dtoName ] = value
          return cb(err)
        })
      }
    }, function (err) {
      return callback(err, dto)
    })
  },
  registerType: function (name, type) {
    converter.types[ name ] = type
    compile(type)
  },
  /**
   * Sandwiches work between DTO conversions. The algorithm is as follows.
   * <ul>
   * <li>The given DTO is converted to the given domain object given by
   * <code>type</code>.</li>
   * <li>If conversion fails, <code>cb</code> is immediately called with the
   * error.</li>
   * <li>If conversion succeeds, <code>fn</code> is called with the converted
   * domain object and a completion callback of the form
   * <code>function(err, domainOut)</code>.</li>
   * <li>If <code>fn</code> fails, then the given callback should be invoked
   * with the error.</li>
   * <li>If <code>fn</code> succeeds, then the given callback should be
   * invoked with a falsey error value and the desired outbound domain object.</li>
   * <li>The outbound domain object is converted back to a DTO and
   * <code>cb</code> is called with error (if there was one) and the outbound
   * dto (if there was no error).</li>
   * </ul>
   *
   * @param type
   *          The fully qualified name of the type used by the converter.
   * @param dtoIn
   *          The inbound data as a DTO.
   * @param fn
   *          A function representing the domain work to be done. Signature is
   *          <code>function(domainIn, callback)</code> where callback is of
   *          the form <code>function(err, domainOut)</code>. The function
   *          <code>fn</code> must call <code>callback</code> to signal
   *          completion of work, passing an error if one occurred or a falsey
   *          value and the domain object to be converted to a DTO, if an error
   *          didn't occur.
   * @param cb
   *          A completion callback of the form <codeLfunction(err, dtoOut)</code>
   *          where <code>dtoOut</code> is the result of converting the domain
   *          object given to <code>fn</code>'s callback.
   */
  sandwich: function (type, dtoIn, fn, cb) {
    converter.from(type, dtoIn, function (errIn, domainIn) {
      if (errIn) return cb(errIn)
      fn(domainIn, function (errFn, domainOut) {
        if (errFn) return cb(errFn)
        converter.to(type, domainOut, function (errOut, dtoOut) {
          cb(errOut, dtoOut)
        })
      })
    })
  }
}
converter.to = converter.toDto
converter.from = converter.fromDto
