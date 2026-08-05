const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Task, Project, ProjectMember, User } = require('../models');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/dashboard - Personal dashboard overview
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Fetch all tasks assigned to the logged-in user
    const assignedTasks = await Task.findAll({
      where: { assignedToId: userId },
      include: [
        { model: Project, as: 'Project', attributes: ['id', 'name'] },
        { model: User, as: 'Creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['dueDate', 'ASC'], ['updatedAt', 'DESC']]
    });

    // Counts by status
    const todoCount = assignedTasks.filter(t => t.status === 'To Do').length;
    const inProgressCount = assignedTasks.filter(t => t.status === 'In Progress').length;
    const doneCount = assignedTasks.filter(t => t.status === 'Done').length;
    const totalAssigned = assignedTasks.length;

    // Overdue tasks callout (dueDate < today and status != 'Done')
    const overdueTasks = assignedTasks.filter(t => {
      if (!t.dueDate || t.status === 'Done') return false;
      return t.dueDate < today;
    });

    // Fetch projects current user belongs to
    const memberships = await ProjectMember.findAll({
      where: { userId },
      include: [
        {
          model: Project,
          as: 'Project',
          include: [{ model: User, as: 'Owner', attributes: ['id', 'name'] }]
        }
      ]
    });

    const userProjects = memberships.map(m => ({
      id: m.Project.id,
      name: m.Project.name,
      description: m.Project.description,
      role: m.role,
      owner: m.Project.Owner
    }));

    res.json({
      metrics: {
        totalAssigned,
        todoCount,
        inProgressCount,
        doneCount,
        overdueCount: overdueTasks.length
      },
      overdueTasks,
      assignedTasks,
      userProjects
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data: ' + err.message });
  }
});

module.exports = router;
