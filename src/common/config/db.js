'use strict';
/**
 * db config
 * @type {Object}
 */
export default {
  type: 'postgresql',
  log_sql: true,
  log_connect: true,
  adapter: {
    postgresql: {
      host: ["127.0.0.1"],
      port: ["5432"],
      database: 'cmpage',
      user: 'postgres',
      password: 'defans',
      prefix: '',
      encoding: 'utf8'
    }
  }
};