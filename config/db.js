const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

const host = process.env.MYSQLHOST || process.env.MYSQL_HOST;
const database = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE;
const user = process.env.MYSQLUSER || process.env.MYSQL_USER;
const password = process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD;
const port = process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306;

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL;

if (host && database) {
  console.log(`Configuring MySQL connection via host parameters (${host}:${port}/${database})...`);
  sequelize = new Sequelize(database, user || 'root', password || '', {
    host: host,
    port: parseInt(port, 10),
    dialect: 'mysql',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (dbUrl) {
  console.log('Configuring database connection via URL string...');
  const isMysql = dbUrl.startsWith('mysql://');
  sequelize = new Sequelize(dbUrl, {
    dialect: isMysql ? 'mysql' : 'postgres',
    protocol: isMysql ? 'mysql' : 'postgres',
    logging: console.log,
    dialectOptions: !isMysql && (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
} else {
  console.log('No external DB configured. Using local SQLite database...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false
  });
}

module.exports = sequelize;
