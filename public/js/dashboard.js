// TaskFlow Personal Dashboard Component
const Dashboard = {
  async render() {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    if (!Auth.currentUser) {
      container.innerHTML = `
        <div class="glass-panel" style="text-align: center; padding: 4rem 2rem;">
          <h2 style="margin-bottom: 1rem;">Welcome to TaskFlow</h2>
          <p style="color: var(--text-muted); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto;">
            Please log in or sign up to view your dashboard, projects, and task Kanban boards with role-based access.
          </p>
          <button class="btn" onclick="App.openAuthModal()">Login / Sign Up</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <p style="color: var(--text-muted);">Loading your dashboard data...</p>
      </div>
    `;

    try {
      const data = await API.getDashboard();
      const { metrics, overdueTasks, assignedTasks, userProjects } = data;

      const overdueHtml = overdueTasks.length > 0 ? `
        <div class="overdue-banner">
          <div class="banner-content">
            <div class="banner-icon">⚠️</div>
            <div>
              <h4 style="color: #f87171; margin-bottom: 0.2rem;">Overdue Tasks Callout (${overdueTasks.length})</h4>
              <p style="font-size: 0.85rem; color: #fca5a5;">
                You have ${overdueTasks.length} task(s) past their due date requiring immediate attention!
              </p>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="Dashboard.scrollToOverdue()">View Overdue</button>
        </div>
      ` : '';

      const tasksListHtml = assignedTasks.length > 0 ? assignedTasks.map(t => {
        const isOverdue = t.dueDate && t.status !== 'Done' && t.dueDate < new Date().toISOString().split('T')[0];
        return `
          <div class="task-card" style="margin-bottom: 0.8rem; border-left: 4px solid ${this.getStatusColor(t.status)};" id="dash-task-${t.id}">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.4rem;">
              <h4 class="task-title" style="font-size: 0.95rem;">${this.escapeHtml(t.title)}</h4>
              <span class="badge ${this.getPriorityClass(t.priority)}">${t.priority}</span>
            </div>
            <p class="task-desc">${this.escapeHtml(t.description || 'No description provided.')}</p>
            <div class="task-meta">
              <span style="color: var(--primary); font-weight: 500;">📂 ${this.escapeHtml(t.Project ? t.Project.name : 'Project')}</span>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span class="due-date ${isOverdue ? 'overdue' : ''}">
                  📅 ${t.dueDate || 'No due date'} ${isOverdue ? '(Overdue!)' : ''}
                </span>
                <span class="badge" style="background: rgba(255,255,255,0.08); color: #fff;">${t.status}</span>
              </div>
            </div>
          </div>
        `;
      }).join('') : `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No tasks currently assigned to you. Enjoy your clear schedule!
        </div>
      `;

      const projectsListHtml = userProjects.length > 0 ? userProjects.map(p => `
        <div class="project-card" style="padding: 1rem 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 style="font-size: 1.05rem;">${this.escapeHtml(p.name)}</h4>
            <span class="badge ${p.role === 'Admin' ? 'badge-admin' : 'badge-member'}">${p.role}</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">${this.escapeHtml(p.description || 'No description')}</p>
          <button class="btn btn-secondary btn-sm" style="width: 100%; justify-content: center;" onclick="Projects.openProjectDetail(${p.id})">
            Open Kanban Board →
          </button>
        </div>
      `).join('') : `
        <p style="color: var(--text-muted);">You belong to no projects yet. Create or get invited to a project!</p>
      `;

      container.innerHTML = `
        <div class="dashboard-header">
          <div>
            <h2>Dashboard Overview</h2>
            <p style="color: var(--text-muted);">Welcome back, <strong>${this.escapeHtml(Auth.currentUser.name)}</strong>!</p>
          </div>
          <div>
            <button class="btn" onclick="App.openCreateProjectModal()">+ New Project</button>
          </div>
        </div>

        ${overdueHtml}

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total">📊</div>
            <div class="stat-info">
              <h3>${metrics.totalAssigned}</h3>
              <p>Total Assigned Tasks</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon todo">📝</div>
            <div class="stat-info">
              <h3>${metrics.todoCount}</h3>
              <p>To Do Tasks</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon progress">⚡</div>
            <div class="stat-info">
              <h3>${metrics.inProgressCount}</h3>
              <p>In Progress</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon done">✅</div>
            <div class="stat-info">
              <h3>${metrics.doneCount}</h3>
              <p>Completed Tasks</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon overdue">🚨</div>
            <div class="stat-info">
              <h3 style="color: ${metrics.overdueCount > 0 ? '#f87171' : 'var(--text-main)'};">${metrics.overdueCount}</h3>
              <p>Overdue Tasks</p>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;" class="dashboard-split">
          <div class="glass-panel">
            <div class="panel-header">
              <h3>My Assigned Tasks Across Projects</h3>
              <span class="count-badge">${assignedTasks.length} tasks</span>
            </div>
            <div id="dashboard-tasks-container">
              ${tasksListHtml}
            </div>
          </div>

          <div class="glass-panel">
            <div class="panel-header">
              <h3>My Projects</h3>
              <span class="count-badge">${userProjects.length} projects</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${projectsListHtml}
            </div>
          </div>
        </div>
      `;

    } catch (err) {
      container.innerHTML = `
        <div class="glass-panel" style="text-align: center; padding: 2rem;">
          <p style="color: #f87171;">Failed to load dashboard: ${err.message}</p>
          <button class="btn btn-secondary" style="margin-top: 1rem;" onclick="Dashboard.render()">Retry</button>
        </div>
      `;
    }
  },

  scrollToOverdue() {
    const banner = document.querySelector('.overdue-banner');
    if (banner) {
      banner.scrollIntoView({ behavior: 'smooth' });
    }
  },

  getStatusColor(status) {
    if (status === 'Done') return 'var(--status-done)';
    if (status === 'In Progress') return 'var(--status-inprogress)';
    return 'var(--status-todo)';
  },

  getPriorityClass(priority) {
    switch (priority) {
      case 'Urgent': return 'badge-urgent';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      default: return 'badge-low';
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }
};

window.Dashboard = Dashboard;
