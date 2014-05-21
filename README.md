# ORM Wrapper [![Build Status](https://secure.travis-ci.org/cladera/orm-wrapper.png?branch=master)](http://travis-ci.org/cladera/orm-wrapper)

ORM Multi-connection wrapper.
Javascript interface which allows you manage multiple database connections for node-orm2 module.

## Getting Started
Install the module with: `npm install orm-wrapper`

### Models directory structure

. //Project root
+-- models
|   +-- db1
|       +-- model.js
|       ...
|   +-- db2
|       +-- model.js
|       ...
+-- index.js
...

### Example (index.js)

```javascript
var orm = require('orm-wrapper');
var config = {
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
orm.connect(config,function(err){
  orm.models.Table.find({name: 'Value'}, function(err, results){
    ...
    
    orm.close(); //Close connection
  });
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add mocha tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).


## License
Copyright (c) 2014 Carlos Galan Cladera. Licensed under the MIT license.
