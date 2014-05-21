'use strict';
/* jshint unused:false */
var should = require('should');
var path = require('path');

var test_config = {
  protocol: 'mysql',
  host : '127.0.0.1',
  port: 3306,
  user : 'root',
  password: '',
  database: 'orm_wrapper_test'
};
var test_options = {
  modelsPath: path.join(__dirname, '/models-simple')
};
describe('ORMWrapper Simple', function(){
  var wrapper;
  beforeEach(function(){
    wrapper = require('../index');
  });
  describe('Wrapper connect', function(){
    it('should connect to local mysql', function(done){
      wrapper.connect(test_config,function(err){
        (err === null).should.equal(true);
        (wrapper.connections.db).should.be.type('object');
        wrapper.close(function(err){
          (err === null).should.equal(true);
          (wrapper.connections.db === undefined).should.equal(true);
          done();
        });
      });
    });
  });
});

describe('Auto-defining models', function(){
  var wrapper = require('../index');

  beforeEach(function(done){
    wrapper.connect(test_config, test_options, function(err){
      if(err){
        throw new Error(err);
      }
      wrapper.connections.db.driver.execQuery('CREATE TABLE Test ' +
        '(' +
          'id INT NOT NULL AUTO_INCREMENT, ' +
          'name VARCHAR(45) NOT NULL DEFAULT \'name\',' +
          'PRIMARY KEY (id)' +
        ')', function(err){
        if(err){
          wrapper.close();
          throw new Error(err);
        }
        done();
      });
    });
  });
  afterEach(function(done){
    wrapper.connections.db.driver.execQuery('DROP TABLE Test', function(err){
      if(err){
        wrapper.close();
        throw new Error(err);
      }
      wrapper.close(function(err){
        if(err){
          throw new Error(err);
        }
        done();
      });
    });
  });
  describe('Model import', function(){
    it('should import Test table model', function(done){
      (wrapper.models.Test).should.be.type('function');
      var Test = wrapper.model('Test');
      (Test).should.be.type('function');
      var test = {
        name: 'Test value'
      };
      Test.create(test, function(err, results){
        (err === null).should.equal(true);
        Test.get(results.id, function(err, result){
          (result.name).should.equal('Test value');
          done();
        });
      });
    });
  });
});