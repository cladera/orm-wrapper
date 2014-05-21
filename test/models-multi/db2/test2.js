/**
 * Created by cgcladera on 21/05/14.
 */
module.exports = function(models, db){
  models.Test2 = db.define('Test2',{
    name: {type: 'text', size: 45}
  });
};