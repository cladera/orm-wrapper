/**
 * Created by cgcladera on 21/05/14.
 */
module.exports = function(models, db){
  models.Test = db.define('Test',{
    name: {type: 'text', size: 45}
  });
};