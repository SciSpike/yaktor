var logger = require('../logger')
var BadRequest = require('./BadRequest')
var path = require('path')
try {
  var xmlWriter = require(path.join('nice-xml', 'lib', 'writer'))
  var pushElement = xmlWriter.prototype.pushElement
  xmlWriter.prototype.pushElement = function (name, value) {
    if (value.replace) {
      value = value.replace(/([<>"'&])/g, function (v) {
        return '&#' + v.charCodeAt(0) + ';'
      })
    }
    return pushElement.call(this, name, value)
  }
} catch (e) {
}

(function () {
  'use strict'
  var Response = {
    SERVER_ERROR: 500,
    BAD_REQUEST: 400,
    CREATED: 201,
    DELETED: 204,
    FOUND: 200,
    UPDATED: 200,
    NOT_CREATED: 400,
    NOT_FOUND: 404,
    NOT_UPDATED: 404,
    NOT_AUTHENTICATED: 401,
    NOT_AUTHORIZED: 403,

    get FAILURE () {
      return 'FAILURE'
    },
    get SUCCESS () {
      return 'SUCCESS'
    },
    status: function (err) {
      return err instanceof BadRequest ? Response.BAD_REQUEST : Response.SERVER_ERROR
    },
    Failure: function (err) {
      this.status = Response.FAILURE
      this.error = new Error(err.stack + '\nRethrown:').stack
      this.message = err.message
    },
    page: function (req) {
      var pagination = {}
      pagination.page = parseInt(req.param('page')) || 1
      var parsedPageSize = parseInt(req.param('pageSize'))
      pagination.pageSize = (!isNaN(parsedPageSize)) ? parsedPageSize : 10
      return pagination
    },
    Success: function (results, total, page, pageSize) {
      if (page) {
        this.total = total
        this.maxPage = Math.ceil(total / pageSize)
        this.page = page
        this.pageSize = pageSize
      }
      this.status = Response.SUCCESS
      this.results = results
    },
    find: function (req, res, accepts) {
      var pagination = this.page(req)
      var page = pagination.page
      var pageSize = pagination.pageSize
      return function (err, dtos, total) {
        if (err) {
          logger.error(err)
        }
        res.status(err ? Response.status(err) : Response.FOUND)
        var contentType = req.accepts(accepts)
        switch (contentType) {
          case 'application/json':
            res.type(contentType)
            res.end(JSON.stringify(err
              ? new Response.Failure(err)
              : new Response.Success(
              dtos,
              total,
              page,
              pageSize)
            ))
            break
          case 'text/html':
          case 'application/xhtml+xml':
            res.type(contentType)
            // TODO an HTML or XHTML view
            // res.render("error",{error:err})
            res.end(require('nice-xml').stringify({
              response: err
                ? new Response.Failure(err)
                : new Response.Success(
                dtos,
                total,
                page,
                pageSize)
            }))
            break
          case 'application/x-yaml':
          case 'text/yaml':
            res.type(contentType)
            res.end(require('js-yaml').dump(err
              ? new Response.Failure(err)
              : new Response.Success(
              dtos,
              total,
              page,
              pageSize)
            ))
            break
          default:
            res.type('text/plain')
            res.end(err ? new Error(err.stack + '\nRethrown:').stack : JSON.stringify(dtos))
        }
      }
    },
    read: function (req, res, accepts) {
      return function (err, data) {
        res.status(err ? Response.status(err) : (data ? Response.FOUND : Response.NOT_FOUND))
        var contentType = req.accepts(accepts)
        switch (contentType) {
          case 'application/json':
            res.type(contentType)
            res.end(JSON.stringify(err ? new Response.Failure(err) : data))
            break
          case 'text/html':
          case 'application/xhtml+xml':
            res.type(contentType)
            // TODO an HTML or XHTML view
            // res.render("error",{error:err})
            res.end(require('nice-xml').stringify({
              response: err ? new Response.Failure(err) : data
            }))
            break
          case 'application/x-yaml':
          case 'text/yaml':
            res.type(contentType)
            res.end(require('js-yaml').dump(err ? new Response.Failure(err) : data))
            break
          case 'application/x-www-form-urlencoded':
            res.type(contentType)
            res.end(require('querystring').stringify(err ? new Response.Failure(err) : data))
            break
          default:
            res.type('text/plain')
            res.end(JSON.stringify(err ? new Response.Failure(err) : data))
        }
      }
    },
    update: function (req, res, accepts) {
      return function (err, data) {
        res.status(err ? Response.status(err) : (data ? Response.UPDATED : Response.NOT_UPDATED))
        var contentType = req.accepts(accepts)
        switch (contentType) {
          case 'application/json':
            res.type(contentType)
            res.end(JSON.stringify(err ? new Response.Failure(err) : data))
            break
          case 'text/html':
          case 'application/xhtml+xml':
            res.type(contentType)
            // TODO an HTML or XHTML view
            // res.render("error",{error:err})
            res.end(require('nice-xml').stringify({
              response: err ? new Response.Failure(err) : data
            }))
            break
          case 'application/x-yaml':
          case 'text/yaml':
            res.type(contentType)
            res.end(require('js-yaml').dump(err ? new Response.Failure(err) : data))
            break
          case 'application/x-www-form-urlencoded':
            res.type(contentType)
            res.end(require('querystring').stringify(err ? new Response.Failure(err) : data))
            break
          default:
            res.type('text/plain')
            res.end(JSON.stringify(err ? new Response.Failure(err) : data))
        }
      }
    },
    delete: function (req, res, accepts) {
      return function (err) {
        res.status(err ? Response.status(err) : Response.DELETED)
        if (err) {
          var contentType = req.accepts(accepts)
          switch (contentType) {
            case 'application/json':
              res.type(contentType)
              res.end(JSON.stringify(new Response.Failure(err)))
              break
            case 'text/html':
            case 'application/xhtml+xml':
              res.type(contentType)
              // TODO an HTML or XHTML view
              // res.render("error",{error:err})
              res.end(require('nice-xml').stringify({
                response: new Response.Failure(err)
              }))
              break
            case 'application/x-yaml':
            case 'text/yaml':
              res.type(contentType)
              res.end(require('js-yaml').dump(new Response.Failure(err)))
              break
            case 'application/x-www-form-urlencoded':
              res.type(contentType)
              res.end(require('querystring').stringify(new Response.Failure(err)))
              break
            default:
              res.type('text/plain')
              res.end(JSON.stringify(new Response.Failure(err)))
          }
        } else {
          res.end()
        }
      }
    },
    create: function (req, res, accepts) {
      return function (err, data) {
        res.status(err ? Response.status(err) : (data ? Response.CREATED : Response.NOT_CREATED))
        var contentType = req.accepts(accepts)
        switch (contentType) {
          case 'application/json':
            res.type(contentType)
            res.end(JSON.stringify(err ? new Response.Failure(err) : data))
            break
          case 'text/html':
          case 'application/xhtml+xml':
            res.type(contentType)
            // TODO an HTML or XHTML view
            // res.render("error",{error:err})
            res.end(require('nice-xml').stringify({
              response: err ? new Response.Failure(err) : data
            }))
            break
          case 'application/x-yaml':
          case 'text/yaml':
            res.type(contentType)
            res.end(require('js-yaml').dump(err ? new Response.Failure(err) : data))
            break
          case 'application/x-www-form-urlencoded':
            res.type(contentType)
            res.end(require('querystring').stringify(err ? new Response.Failure(err) : data))
            break
          default:
            res.type('text/plain')
            res.end(JSON.stringify(err ? new Response.Failure(err) : data))
        }
      }
    }
  }

  module.exports = Response
})()
