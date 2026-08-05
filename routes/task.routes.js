const express = require('express');
const router = express.Router({ mergeParams: true });
const { Task, ProjectMember, User } = require('../models');
const auth = require('../middleware/auth');
const { loadProjectMembership, requireAdmin } = require('../middleware/projectAccess');

// Protect all task routes with auth and project membership check
router.use(auth);
router.use(loadProjectMembership);

// GET /api/projects/:projectId/tasks - Get all tasks for the project
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { projectId: req.project.id },
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'Creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks: ' + err.message });
  }
});

// POST /api/projects/:projectId/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedToId } = req.body;

    // Server-side validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const validStatuses = ['To Do', 'In Progress', 'Done'];
    const taskStatus = validStatuses.includes(status) ? status : 'To Do';

    const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
    const taskPriority = validPriorities.includes(priority) ? priority : 'Medium';

    let targetAssigneeId = assignedToId ? parseInt(assignedToId) : null;

    // Role-based Assignment Rules
    if (req.projectMember.role === 'Member') {
      // Member can only assign task to themselves
      targetAssigneeId = req.user.id;
    } else if (targetAssigneeId) {
      // Admin assigning to someone: verify assignee is a project member
      const isMember = await ProjectMember.findOne({
        where: { projectId: req.project.id, userId: targetAssigneeId }
      });

      if (!isMember) {
        return res.status(400).json({ error: 'Assigned user is not a member of this project.' });
      }
    }

    const task = await Task.create({
      projectId: req.project.id,
      title: title.trim(),
      description: description ? description.trim() : '',
      status: taskStatus,
      priority: taskPriority,
      dueDate: dueDate || null,
      assignedToId: targetAssigneeId,
      createdById: req.user.id
    });

    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'Creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json(fullTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task: ' + err.message });
  }
});

// PATCH /api/projects/:projectId/tasks/:taskId/status - Update task status (Kanban move)
router.patch('/:taskId/status', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { status } = req.body;

    const validStatuses = ['To Do', 'In Progress', 'Done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const task = await Task.findOne({
      where: { id: taskId, projectId: req.project.id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found in this project.' });
    }

    // Role Enforcement: Member can only update status if task is assigned to them
    if (req.projectMember.role === 'Member' && task.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Members can only change status of tasks assigned to them.' });
    }

    task.status = status;
    await task.save();

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'Creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task status: ' + err.message });
  }
});

// PUT /api/projects/:projectId/tasks/:taskId - Update full task details
router.put('/:taskId', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { title, description, status, priority, dueDate, assignedToId } = req.body;

    const task = await Task.findOne({
      where: { id: taskId, projectId: req.project.id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Member access restrictions
    if (req.projectMember.role === 'Member') {
      // Member can only edit tasks created by them or assigned to them
      if (task.createdById !== req.user.id && task.assignedToId !== req.user.id) {
        return res.status(403).json({ error: 'Only Admins or task assignees/creators can edit task details.' });
      }
    }

    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({ error: 'Title cannot be empty.' });
      }
      task.title = title.trim();
    }

    if (description !== undefined) task.description = description.trim();

    if (status) {
      const validStatuses = ['To Do', 'In Progress', 'Done'];
      if (validStatuses.includes(status)) task.status = status;
    }

    if (priority) {
      const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
      if (validPriorities.includes(priority)) task.priority = priority;
    }

    if (dueDate !== undefined) task.dueDate = dueDate || null;

    if (assignedToId !== undefined) {
      if (req.projectMember.role === 'Member') {
        // Members cannot reassign tasks to others
        task.assignedToId = req.user.id;
      } else if (assignedToId) {
        const targetAssigneeId = parseInt(assignedToId);
        const isMember = await ProjectMember.findOne({
          where: { projectId: req.project.id, userId: targetAssigneeId }
        });
        if (!isMember) {
          return res.status(400).json({ error: 'Assigned user is not a member of this project.' });
        }
        task.assignedToId = targetAssigneeId;
      } else {
        task.assignedToId = null;
      }
    }

    await task.save();

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'Creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task: ' + err.message });
  }
});

// DELETE /api/projects/:projectId/tasks/:taskId - Delete task (Admin only)
router.delete('/:taskId', requireAdmin, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const task = await Task.findOne({
      where: { id: taskId, projectId: req.project.id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await task.destroy();
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task: ' + err.message });
  }
});

module.exports = router;
