'use strict';
/**
 * Created by cgcladera on 14/05/14.
 */
var orm     = require('orm');
var fs      = require('fs');
var path    = require('path');
var _       = require('underscore');

/**
 * ORM Multi-connections wrapper
 * @constructor
 */
function ORMWrapper(){
  this.connections = {};
  this.models = {};
  this.options = {
    modelsPath: path.join(__dirname+'/models'),
    relationshipsFile: '_relations.js'
  };
}
/**
 *
 * @param {Object} config
 * @param {Object|Function} options
 * @param {Function} cb
 */
ORMWrapper.prototype.connect = function(config,options,cb){
  var self = this;
  if(typeof options === 'function'){
    cb = options;
    options = {};
  }
  options = options || {};
  _.extend(this.options, options);
  cb = cb || function(){};

  var connectionsCount = 1;
  var schemas = ['db'];
  var conf = {
    db: config
  };

  if(config.schemas) {
    schemas = Object.keys(config.schemas);
    connectionsCount = schemas.length;
    conf = config.schemas;
  }
  var next = function(){
    var schema = schemas.shift();
    orm.connect(conf[schema], function(err, db){
      if(err){
        return cb(err);
      }
      self.connections[schema] = db;
      self._setup(schema, db);
      connectionsCount--;
      if(connectionsCount === 0){
        cb(null, self);
      }else {
        next();
      }
    });
  };
  next();
};

/**
 *
 * @param {String} name
 * @returns {Object}
 */
ORMWrapper.prototype.model = function(name){
  return this.models[name];
};

/**
 * Close all db connections
 */
ORMWrapper.prototype.close = function(cb) {
  var self = this;
  var connections = Object.keys(self.connections);
  var count = connections.length;
  var next = function(){
    var conn = connections.shift();
    self._closeConnection(conn, function(err){
      if(err){
        return cb(err);
      }
      count--;
      if(count === 0){
        self.models = {};
        return cb(null);
      }
      next();
    });
  };
  next();
};

/**
 *
 * @param {string} conn
 * @param {Function} cb
 * @private
 */
ORMWrapper.prototype._closeConnection = function(conn, cb){
  var self = this;
  if(!this.connections[conn]){
    cb('Connection not found');
  }
  this.connections[conn].close(function(err){
    if(err){
      return cb(err);
    }
    delete self.connections[conn];
    cb();
  });
};

/**
 *
 * @param {String} schema
 * @param {Object} db
 * @private
 */
ORMWrapper.prototype._setup = function(schema, db){
  var self = this;
  schema = (schema === 'db')?'':schema;
  var modelsPath = path.normalize(this.options.modelsPath+'/'+schema+'/');
  if(fs.existsSync(modelsPath)){
    fs.readdirSync(modelsPath).forEach(function (file) {
      if (/(^[^_].*)\.(js$|coffee$)/.test(file)) {
        require(modelsPath + '/' + file)(self.models, db);
      }
      if (fs.existsSync(modelsPath + self.options.relationshipsFile)) {
        var filePath = path.normalize(modelsPath + '/' + self.options.relationshipsFile);
        require(filePath)(self.models);
      }
    });
  }
};

module.exports = ORMWrapper;