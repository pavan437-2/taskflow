const { Project, ProjectMember } = require('../models');

const loadProjectMembership = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.projectId;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required.' });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const member = await ProjectMember.findOne({
      where: {
        projectId: project.id,
        userId: req.user.id
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    req.project = project;
    req.projectMember = member;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Error checking project permissions: ' + err.message });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.projectMember || req.projectMember.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied. Only project Admins can perform this action.' });
  }
  next();
};

module.exports = {
  loadProjectMembership,
  requireAdmin
};
