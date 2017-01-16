'use strict';
/**
 * db config
 * @type {Object}
 */
export default {
  type: 'mssql',
  log_sql: true,
  log_connect: true,
  adapter: {
    mssql: {
        //host: "192.168.2.132",
        host: "127.0.0.1",
        port:"1433",
        database: 'cmpage',
        user: 'cmpage',
        password: 'defans',
        prefix: '',
        encoding: 'utf8'
    }
  }
};
