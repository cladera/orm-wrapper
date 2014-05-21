/**
 * Created by cgcladera on 21/05/14.
 */
module.exports = function(models, db){
  models.Test1 = db.define('Test1',{
    name: {type: 'text', size: 45}
  });
};