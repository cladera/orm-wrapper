/**
 * Created by cgcladera on 21/05/14.
 */
'use strict';

var should = require('should');
var path = require('path');

var test_config = {
  schemas: {
    db1:{
      protocol: 'mysql',
      host : '127.0.0.1',
      port: 3306,
      user : 'root',
      password: '',
      database: 'orm_wrapper_test'
    },
    db2:{
      protocol: 'mysql',
      host : '127.0.0.1',
      port: 3306,
      user : 'root',
      password: '',
      database: 'orm_wrapper_test2'
    }
  }
};
var test_options = {
  modelsPath: path.join(__dirname, '/models-multi')
};

describe('ORMWrapper Multi-connection', function(){
  var wrapper;
  beforeEach(function(){
    wrapper = require('../index');
  });
  describe('Wrapper connect', function(){
    it('should connect to local mysql', function(done){
      wrapper.connect(test_config,function(err){
        console.log(err);
        (err === null).should.be.true;
        (wrapper.connections.db1).should.be.ok;
        (wrapper.connections.db2).should.be.ok;
        wrapper.close(function(err){
          (err === null).should.be.true;
          (wrapper.connections.db1 === undefined).should.be.true;
          (wrapper.connections.db2 === undefined).should.be.true;
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
      wrapper.connections.db1.driver.execQuery('CREATE TABLE Test1 ' +
        '(' +
        'id INT NOT NULL AUTO_INCREMENT, ' +
        'name VARCHAR(45) NOT NULL DEFAULT \'name\',' +
        'PRIMARY KEY (id)' +
        ')', function(err){
        if(err){
          wrapper.close();
          throw new Error(err);
        }
        wrapper.connections.db2.driver.execQuery('CREATE TABLE Test2 ' +
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
  });
  afterEach(function(done){
    wrapper.connections.db1.driver.execQuery('DROP TABLE Test1', function(err){
      if(err){
        wrapper.close();
        throw new Error(err);
      }
      wrapper.connections.db2.driver.execQuery('DROP TABLE Test2', function(err){
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
  });
  describe('Model import', function(){
    it('should import Test table model', function(done){
      (wrapper.models.Test1).should.be.ok;
      (wrapper.models.Test2).should.be.ok;
      var Test1 = wrapper.model('Test1');
      (Test1).should.be.ok;
      var Test2 = wrapper.model('Test2');
      (Test2).should.be.ok;
      var test1 = {
        name: 'Test 1 value'
      };
      var test2 = {
        name: 'Test 2 value'
      };
      Test1.create(test1, function(err, results){
        (err === null).should.be.true;
        Test1.get(results.id, function(err, result){
          (result.name).should.equal('Test 1 value');
          Test2.create(test2, function(err, results){
            (err === null).should.be.true;
            Test2.get(results.id, function(err, result){
              (result.name).should.equal('Test 2 value');
              done();
            });
          });
        });
      });
    });
  });
});
