'use strict';
/**
 * Created by Marc Ferrer on 4/03/15.
 */
/* jshint unused:false */
var should = require('should');
var path = require('path');

var testConfig = {
  protocol: 'mysql',
  host : '127.0.0.1',
  port: 3306,
  user : 'root',
  password: '',
  database: 'orm_wrapper_test'
};
var testOptions = {
  modelsPath: path.join(__dirname, '/models-simple')
};

describe('DB connection loss', function(){
  var wrapper;
  beforeEach(function(){
    wrapper = require('../index');
  });
  afterEach(function(done){
    wrapper.close(function(err){
      if(err){
        throw new Error(err);
      }
      done();
    });
  });
  it('Should reconnect to the server after a PROTOCOL_CONNECTION_LOST event', function(done){
    wrapper.connect(testConfig, testOptions, function(err){
      (err === null).should.equal(true);
      (wrapper.connections.db).should.be.type('object');
      wrapper.connections.db.should.not.have.property('connectionRetries');
      wrapper.handleDisconnections(testConfig, {retries: 10, delay: 500});
      wrapper.connections.db.connectionRetries.should.equal(0);
      wrapper.connections.db.should.have.property('emit');
      wrapper.connections.db.emit('error', 'PROTOCOL_CONNECTION_LOST');
      wrapper.connections.db.connectionRetries.should.equal(1);
      var timer = setTimeout(function(){
        wrapper.connections.db.connectionRetries.should.equal(0);
        wrapper.connections.db.driver.execQuery('show tables', function(err){
          clearTimeout(timer);
          if(err){
            throw new Error(err);
          }
          done();
        });
      }, 1000);
    });
  });
});

