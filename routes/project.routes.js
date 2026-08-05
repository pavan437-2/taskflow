const express = require('express');
const router = express.Router();
const { Project, ProjectMember, User, Task } = require('../models');
const auth = require('../middleware/auth');
const { loadProjectMembership, requireAdmin } = require('../middleware/projectAccess');

// Protect all project routes with auth
router.use(auth);

// GET /api/projects - List projects where current user is a member
router.get('/', async (req, res) => {
  try {
    const memberships = await ProjectMember.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Project,
          as: 'Project',
          include: [
            { model: User, as: 'Owner', attributes: ['id', 'name', 'email'] }
          ]
        }
      ]
    });

    const projects = memberships.map(m => {
      const p = m.Project ? m.Project.toJSON() : {};
      p.currentUserRole = m.role;
      return p;
    });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects: ' + err.message });
  }
});

// POST /api/projects - Create a new project
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      ownerId: req.user.id
    });

    // Add creator as Admin in ProjectMember table
    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id,
      role: 'Admin'
    });

    const projectWithDetails = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'Owner', attributes: ['id', 'name', 'email'] }]
    });

    const result = projectWithDetails.toJSON();
    result.currentUserRole = 'Admin';

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project: ' + err.message });
  }
});

// GET /api/projects/:id - Get project details and members
router.get('/:id', loadProjectMembership, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'name', 'email'] },
        {
          model: ProjectMember,
          as: 'ProjectMembers',
          include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'] }]
        }
      ]
    });

    const result = project.toJSON();
    result.currentUserRole = req.projectMember.role;

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project details: ' + err.message });
  }
});

// PUT /api/projects/:id - Update project (Admin only)
router.put('/:id', loadProjectMembership, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Project name cannot be empty.' });
    }

    req.project.name = name.trim();
    if (description !== undefined) {
      req.project.description = description.trim();
    }
    await req.project.save();

    res.json({ message: 'Project updated successfully', project: req.project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project: ' + err.message });
  }
});

// DELETE /api/projects/:id - Delete project (Admin only)
router.delete('/:id', loadProjectMembership, requireAdmin, async (req, res) => {
  try {
    // Delete associated tasks first (or handle via cascade)
    await Task.destroy({ where: { projectId: req.project.id } });
    await ProjectMember.destroy({ where: { projectId: req.project.id } });
    await req.project.destroy();

    res.json({ message: 'Project and all associated tasks deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project: ' + err.message });
  }
});

// --- MEMBER MANAGEMENT ---

// POST /api/projects/:id/members - Invite teammate by email (Admin only)
router.post('/:id/members', loadProjectMembership, requireAdmin, async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const memberRole = role === 'Admin' ? 'Admin' : 'Member';

    // Find target user by email
    const userToInvite = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!userToInvite) {
      return res.status(404).json({ error: 'No user registered with this email address.' });
    }

    // Check if already a member
    const existingMember = await ProjectMember.findOne({
      where: { projectId: req.project.id, userId: userToInvite.id }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'This user is already a member of the project.' });
    }

    // Add member
    const newMember = await ProjectMember.create({
      projectId: req.project.id,
      userId: userToInvite.id,
      role: memberRole
    });

    res.status(201).json({
      message: 'Teammate added to project successfully',
      member: {
        id: newMember.id,
        role: newMember.role,
        user: {
          id: userToInvite.id,
          name: userToInvite.name,
          email: userToInvite.email
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member: ' + err.message });
  }
});

// PATCH /api/projects/:id/members/:userId - Promote/Demote member role (Admin only)
router.patch('/:id/members/:userId', loadProjectMembership, requireAdmin, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    const { role } = req.body;

    if (!['Admin', 'Member'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either Admin or Member.' });
    }

    // Prevent demoting the project owner
    if (targetUserId === req.project.ownerId && role !== 'Admin') {
      return res.status(400).json({ error: 'Cannot demote the project owner from Admin role.' });
    }

    const member = await ProjectMember.findOne({
      where: { projectId: req.project.id, userId: targetUserId }
    });

    if (!member) {
      return res.status(404).json({ error: 'User is not a member of this project.' });
    }

    member.role = role;
    await member.save();

    res.json({ message: `Member role updated to ${role}`, member });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update member role: ' + err.message });
  }
});

// DELETE /api/projects/:id/members/:userId - Remove member from project (Admin only or self)
router.delete('/:id/members/:userId', loadProjectMembership, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);

    // If not target user themselves, must be Admin
    if (req.user.id !== targetUserId && req.projectMember.role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admins can remove members from the project.' });
    }

    // Cannot remove project owner
    if (targetUserId === req.project.ownerId) {
      return res.status(400).json({ error: 'The project owner cannot be removed from the project.' });
    }

    const member = await ProjectMember.findOne({
      where: { projectId: req.project.id, userId: targetUserId }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found in this project.' });
    }

    await member.destroy();

    // Optionally unassign tasks assigned to removed user in this project
    await Task.update(
      { assignedToId: null },
      { where: { projectId: req.project.id, assignedToId: targetUserId } }
    );

    res.json({ message: 'Member removed from project successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member: ' + err.message });
  }
});

module.exports = router;
