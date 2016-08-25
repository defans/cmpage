'use strict';

var sql = require('mssql/nofix');

var config = {
  user: 'sa',
  password: '123456',
  server: '127.0.0.1', // You can use 'localhost\\instance' to connect to named instance
  database: 'ERPCommpage',

  options: {
    encrypt: true // Use this if you're on Windows Azure
  }
};

sql.connect(config, function(err) {
  // ... error checks
  console.dir(err);
  // Query

  new sql.Request().query("select * from t_commpage where c_modulename='Log'", function(err, recordset) {
    // ... error checks
  console.log('ddd');
    console.dir(recordset);
  });

});

sql.on('error', function(err) {
  console.log('err:');
  console.dir(err);
});
