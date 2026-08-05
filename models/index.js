const sequelize = require('../config/db');
const User = require('./user.model');
const Project = require('./project.model');
const ProjectMember = require('./projectMember.model');
const Task = require('./task.model');

// User <-> Project Ownership
User.hasMany(Project, { foreignKey: 'ownerId', as: 'OwnedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'Owner' });

// User <-> Project Memberships (Many-to-Many via ProjectMember)
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'userId', otherKey: 'projectId', as: 'MemberProjects' });
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'projectId', otherKey: 'userId', as: 'Members' });

ProjectMember.belongsTo(User, { foreignKey: 'userId', as: 'User' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId', as: 'Project' });
User.hasMany(ProjectMember, { foreignKey: 'userId' });
Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'ProjectMembers' });

// Project <-> Task
Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE', as: 'Tasks' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'Project' });

// Task <-> User (Assignee & Creator)
User.hasMany(Task, { foreignKey: 'assignedToId', as: 'AssignedTasks' });
Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'Assignee' });

User.hasMany(Task, { foreignKey: 'createdById', as: 'CreatedTasks' });
Task.belongsTo(User, { foreignKey: 'createdById', as: 'Creator' });

module.exports = {
  sequelize,
  User,
  Project,
  ProjectMember,
  Task
};
