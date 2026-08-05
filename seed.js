const bcrypt = require('bcryptjs');
const { sequelize, User, Project, ProjectMember, Task } = require('./models');

async function seed() {
  try {
    console.log('Synchronizing database schema...');
    await sequelize.sync({ force: true });

    console.log('Seeding initial users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await User.create({
      name: 'Alex Rivera (Admin)',
      email: 'admin@taskflow.com',
      password: hashedPassword
    });

    const member1 = await User.create({
      name: 'Sam Taylor (Member)',
      email: 'member@taskflow.com',
      password: hashedPassword
    });

    const member2 = await User.create({
      name: 'Jordan Lee (Member)',
      email: 'jordan@taskflow.com',
      password: hashedPassword
    });

    console.log('Seeding projects...');
    const project1 = await Project.create({
      name: 'TaskFlow Web Application',
      description: 'Full-stack project and task management system built with Express, Sequelize, and Vanilla Web UI.',
      ownerId: admin.id
    });

    const project2 = await Project.create({
      name: 'Mobile App Experience',
      description: 'iOS & Android app interface design system and offline sync architecture.',
      ownerId: admin.id
    });

    console.log('Seeding project memberships...');
    // Project 1 members
    await ProjectMember.create({ projectId: project1.id, userId: admin.id, role: 'Admin' });
    await ProjectMember.create({ projectId: project1.id, userId: member1.id, role: 'Member' });
    await ProjectMember.create({ projectId: project1.id, userId: member2.id, role: 'Member' });

    // Project 2 members
    await ProjectMember.create({ projectId: project2.id, userId: admin.id, role: 'Admin' });
    await ProjectMember.create({ projectId: project2.id, userId: member1.id, role: 'Member' });

    console.log('Seeding tasks...');
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 3);

    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 5);

    // Project 1 Tasks
    await Task.create({
      projectId: project1.id,
      title: 'Design Database Schema & Relationships',
      description: 'Implement Sequelize models for User, Project, ProjectMember, and Task.',
      status: 'Done',
      priority: 'High',
      dueDate: pastDate.toISOString().split('T')[0],
      assignedToId: admin.id,
      createdById: admin.id
    });

    await Task.create({
      projectId: project1.id,
      title: 'Build Role-Based REST APIs',
      description: 'Construct Express middleware to enforce Admin vs Member permissions.',
      status: 'In Progress',
      priority: 'Urgent',
      dueDate: pastDate.toISOString().split('T')[0], // Overdue task!
      assignedToId: member1.id,
      createdById: admin.id
    });

    await Task.create({
      projectId: project1.id,
      title: 'Create Interactive Kanban Board UI',
      description: 'Implement column cards, status transitions, and filter controls.',
      status: 'To Do',
      priority: 'Medium',
      dueDate: futureDate.toISOString().split('T')[0],
      assignedToId: member1.id,
      createdById: admin.id
    });

    await Task.create({
      projectId: project1.id,
      title: 'Configure Railway Deployment Package',
      description: 'Add Procfile, env handling, and SQLite to PostgreSQL migration setup.',
      status: 'To Do',
      priority: 'High',
      dueDate: futureDate.toISOString().split('T')[0],
      assignedToId: member2.id,
      createdById: admin.id
    });

    // Project 2 Tasks
    await Task.create({
      projectId: project2.id,
      title: 'Mobile Wireframes & Figma Prototype',
      description: 'Draft high-fidelity mobile UI components for dark mode experience.',
      status: 'In Progress',
      priority: 'High',
      dueDate: futureDate.toISOString().split('T')[0],
      assignedToId: member1.id,
      createdById: admin.id
    });

    console.log('\n✅ Database seeding complete!');
    console.log('----------------------------------------------------');
    console.log('Demo Accounts:');
    console.log('1. Admin:  email: admin@taskflow.com  | password: password123');
    console.log('2. Member: email: member@taskflow.com | password: password123');
    console.log('3. Member: email: jordan@taskflow.com | password: password123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
