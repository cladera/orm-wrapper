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
  var initialConnections;
  before(function(done){
    wrapper = require('../index');
    wrapper.connect(testConfig, testOptions, function(err){
      (err === null).should.equal(true);
      wrapper.connections.db.driver.execQuery('show status like \'%Threads_connected%\';', function(err, data){
        (err === null).should.equal(true);
        (wrapper.connections.db).should.be.type('object');
        initialConnections = data[0].Value;
        wrapper.handleDisconnections(testConfig, {retries: 10, delay: 500});
        done();
      });
    });
  });
  /*beforeEach(function(){
    wrapper = require('../index');
  });*/
  after(function(done){
    wrapper.close(function(err){
      if(err){
        throw new Error(err);
      }
      done();
    });
  });
  it('Should reconnect to the server after a PROTOCOL_CONNECTION_LOST event', function(done){
    /*wrapper.connect(testConfig, testOptions, function(err){
      (err === null).should.equal(true);
      (wrapper.connections.db).should.be.type('object');
      wrapper.connections.db.should.not.have.property('connectionRetries');
      wrapper.handleDisconnections(testConfig, {retries: 10, delay: 500});
      wrapper.connections.db.connectionRetries.should.equal(0);
      wrapper.connections.db.should.have.property('emit');
      var error = {code: 'PROTOCOL_CONNECTION_LOST'};
      error.fatal = true;
      wrapper.connections.db.emit('error', error);
      wrapper.connections.db.connectionRetries.should.equal(1);
      //wrapper.connections.db.driver.execQuery('SET SESSION wait_timeout = 2;');
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
    });*/
    wrapper.connections.db.connectionRetries.should.equal(0);
    wrapper.connections.db.should.have.property('emit');
    var error = {code: 'PROTOCOL_CONNECTION_LOST'};
    error.fatal = true;
    wrapper.connections.db.emit('error', error);
    wrapper.connections.db.connectionRetries.should.equal(1);
    //wrapper.connections.db.driver.execQuery('SET SESSION wait_timeout = 2;');
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
  describe('Showing DB connections', function(){
    before(function(done){
      setTimeout(function(){
        done();
      }, 2500);
    });
    it('Should reconnec using new disconnections handler', function(done){
      wrapper.connections.db.driver.opts.settings.set('connection.reconnect', false);
      wrapper.connections.db.driver.execQuery('SET SESSION wait_timeout = 2;', function(err){
        (err === null).should.equal(true);
        //We expect the connectin to be closed after setting wait_timeout to 2s
        var timer2 = setTimeout(function(){
          clearTimeout(timer2);
          wrapper.connections.db.driver.execQuery('show tables', function(err){
            (err === null).should.equal(false);
          });
        }, 2100);
        var timer = setTimeout(function(){
          clearTimeout(timer);
          wrapper.connections.db.connectionRetries.should.equal(0);
          wrapper.connections.db.driver.execQuery('show status like \'%Threads_connected%\';', function(err, data){
            (err === null).should.equal(true);
            //Check that new disconnections handler do not create extra connections
            data[0].Value.should.equal(initialConnections);
            done();
          });
        }, 2700);
      });
    });
  });
});

