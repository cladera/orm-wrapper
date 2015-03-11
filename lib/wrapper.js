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
  this.static = orm;
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
    self.static.connect(conf[schema], function(err, db){
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
 * Reconnect to a DB.
 * @param {Object}  schema  DB connection name / schema.
 * @param {Object}  config  Config object containing schema configurations.
 * indexed by schema names.
 * @param {Object}  options Additional reconnection options (max retries & delay time).
 */
ORMWrapper.prototype.delayedReconnect = function(schema, config, options){
  var self = this;
  var timer;
  timer = setTimeout(function(){
    self.connections[schema].connectionRetries++;
    self.static.connect(config[schema], function(err, db){
      if (!err){
        self.connections[schema].driver.db.end(function(){});
        self.connections[schema] = db;
        self._setup(schema, db);
        self.connections[schema].connectionRetries = 0;
        self.errorHandler(schema, config, options);
        clearInterval(timer);

      }else{
        if (self.connections[schema].connectionRetries <= options.retries){
          self.delayedReconnect(schema, config, options);
        }
      }
    });
  }, options.delay);
};

/**
 * Declares error handler for a single schema.
 * @param {Object}  schema  DB connection name / schema.
 * @param {Object}  config  Config object containing schema configurations.
 * indexed by schema names.
 * @param {Object}  options Additional reconnection options (max retries & delay time).
 */
ORMWrapper.prototype.errorHandler = function(schema, config, options){
  var self = this;
  this.connections[schema].on('error', function(err){
    if (!err.fatal){
      return;
    }
    if (err.code !== 'PROTOCOL_CONNECTION_LOST'){
      throw err;
    }
    if (self.connections[schema].connectionRetries <= options.retries){
      self.connections[schema].connectionRetries++;
      self.delayedReconnect(schema, config, options);
      self.reconnecting = true;
    }
  });
};

/**
 * Enable auto-reconnection handlers.
 * @param {Object}  config  Config object containing schema configurations.
 * indexed by schema names.
 * @param {Object}  options Additional reconnection options (max retries & delay time).
 */
ORMWrapper.prototype.handleDisconnections = function(config, options){
  var defaultOptions = {retries: 5, delay: 12000};
  var conf = {
    db: config
  };
  if(config.schemas) {
    conf = config.schemas;
  }
  options = _.extend(defaultOptions, options);
  for (var schema in this.connections){
    if (this.connections.hasOwnProperty(schema)){
      this.connections[schema].connectionRetries = 0;
      this.errorHandler(schema, conf, options);
    }
  }
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
    });
    if (fs.existsSync(modelsPath + self.options.relationshipsFile)) {
      var filePath = path.normalize(modelsPath + '/' + self.options.relationshipsFile);
      require(filePath)(self.models);
    }
  }
};

module.exports = ORMWrapper;