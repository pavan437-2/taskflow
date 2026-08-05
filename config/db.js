const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

const postgresUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_PUBLIC_URL;

const pgHost = process.env.PGHOST || process.env.POSTGRES_HOST;
const pgDatabase = process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.POSTGRES_DATABASE;
const pgUser = process.env.PGUSER || process.env.POSTGRES_USER;
const pgPassword = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
const pgPort = process.env.PGPORT || process.env.POSTGRES_PORT || 5432;

const mysqlHost = process.env.MYSQLHOST || process.env.MYSQL_HOST;
const mysqlDatabase = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE;
const mysqlUser = process.env.MYSQLUSER || process.env.MYSQL_USER;
const mysqlPassword = process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD;
const mysqlPort = process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306;

if (postgresUrl && !postgresUrl.startsWith('mysql://')) {
  console.log('Configuring PostgreSQL connection via URL string...');
  const isProd = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';
  sequelize = new Sequelize(postgresUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: console.log,
    dialectOptions: isProd ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
} else if (pgHost && pgDatabase) {
  console.log(`Configuring PostgreSQL connection via parameters (${pgHost}:${pgPort}/${pgDatabase})...`);
  const isProd = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';
  sequelize = new Sequelize(pgDatabase, pgUser || 'postgres', pgPassword || '', {
    host: pgHost,
    port: parseInt(pgPort, 10),
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: isProd ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
} else if (mysqlHost && mysqlDatabase) {
  console.log(`Configuring MySQL connection via parameters (${mysqlHost}:${mysqlPort}/${mysqlDatabase})...`);
  sequelize = new Sequelize(mysqlDatabase, mysqlUser || 'root', mysqlPassword || '', {
    host: mysqlHost,
    port: parseInt(mysqlPort, 10),
    dialect: 'mysql',
    logging: console.log
  });
} else if (postgresUrl && postgresUrl.startsWith('mysql://')) {
  console.log('Configuring MySQL connection via URL string...');
  sequelize = new Sequelize(postgresUrl, {
    dialect: 'mysql',
    logging: console.log
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
