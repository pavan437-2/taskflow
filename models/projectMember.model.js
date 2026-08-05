const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectMember = sequelize.define('ProjectMember', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Member'),
    allowNull: false,
    defaultValue: 'Member'
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['projectId', 'userId']
    }
  ]
});

module.exports = ProjectMember;
