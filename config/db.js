const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_PRIVATE_URL || process.env.MYSQL_URL;

if (dbUrl) {
  const isMysql = dbUrl.startsWith('mysql://');
  sequelize = new Sequelize(dbUrl, {
    dialect: isMysql ? 'mysql' : 'postgres',
    protocol: isMysql ? 'mysql' : 'postgres',
    logging: false,
    dialectOptions: !isMysql && (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
} else {
  // Local SQLite zero-config setup
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false
  });
}

module.exports = sequelize;
