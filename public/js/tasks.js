// TaskFlow Kanban Board & Task Management Component
const Tasks = {
  currentProject: null,
  allTasks: [],
  filteredTasks: [],

  async loadProjectKanban(project) {
    this.currentProject = project;
    const container = document.getElementById('view-kanban');
    if (!container) return;

    container.innerHTML = `
      <div class="dashboard-header" style="margin-bottom: 1.5rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.3rem;">
            <h2>${this.escapeHtml(project.name)}</h2>
            <span class="badge ${project.currentUserRole === 'Admin' ? 'badge-admin' : 'badge-member'}">
              ${project.currentUserRole} Role
            </span>
          </div>
          <p style="color: var(--text-muted);">${this.escapeHtml(project.description || 'Project Kanban Workspace')}</p>
        </div>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn btn-secondary" onclick="Projects.openMembersModal(${project.id})">
            👥 Team Members (${project.ProjectMembers ? project.ProjectMembers.length : 1})
          </button>
          <button class="btn" onclick="Tasks.openCreateTaskModal()">+ New Task</button>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="glass-panel" style="padding: 1rem 1.25rem; margin-bottom: 1.5rem; display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <input type="text" id="task-search-input" class="form-control" placeholder="🔍 Search tasks by title..." oninput="Tasks.filterTasks()" />
        </div>
        <div>
          <select id="task-priority-filter" class="form-control" onchange="Tasks.filterTasks()">
            <option value="">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <select id="task-assignee-filter" class="form-control" onchange="Tasks.filterTasks()">
            <option value="">All Assignees</option>
            <option value="me">Assigned to Me</option>
            ${(project.ProjectMembers || []).map(m => `
              <option value="${m.User.id}">${this.escapeHtml(m.User.name)}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Kanban Board Columns -->
      <div class="kanban-board">
        <div class="kanban-column" id="col-todo" ondragover="Tasks.handleDragOver(event)" ondrop="Tasks.handleDrop(event, 'To Do')">
          <div class="column-header todo">
            <h3 class="column-title">📝 To Do</h3>
            <span class="count-badge" id="count-todo">0</span>
          </div>
          <div class="task-list" id="list-todo"></div>
        </div>

        <div class="kanban-column" id="col-inprogress" ondragover="Tasks.handleDragOver(event)" ondrop="Tasks.handleDrop(event, 'In Progress')">
          <div class="column-header inprogress">
            <h3 class="column-title">⚡ In Progress</h3>
            <span class="count-badge" id="count-inprogress">0</span>
          </div>
          <div class="task-list" id="list-inprogress"></div>
        </div>

        <div class="kanban-column" id="col-done" ondragover="Tasks.handleDragOver(event)" ondrop="Tasks.handleDrop(event, 'Done')">
          <div class="column-header done">
            <h3 class="column-title">✅ Done</h3>
            <span class="count-badge" id="count-done">0</span>
          </div>
          <div class="task-list" id="list-done"></div>
        </div>
      </div>
    `;

    await this.refreshTasks();
  },

  async refreshTasks() {
    try {
      this.allTasks = await API.getTasks(this.currentProject.id);
      this.filterTasks();
    } catch (err) {
      App.showToast('Failed to fetch tasks: ' + err.message, 'error');
    }
  },

  filterTasks() {
    const searchVal = (document.getElementById('task-search-input')?.value || '').toLowerCase();
    const priorityVal = document.getElementById('task-priority-filter')?.value || '';
    const assigneeVal = document.getElementById('task-assignee-filter')?.value || '';

    this.filteredTasks = this.allTasks.filter(t => {
      if (searchVal && !t.title.toLowerCase().includes(searchVal) && !(t.description || '').toLowerCase().includes(searchVal)) {
        return false;
      }

      if (priorityVal && t.priority !== priorityVal) {
        return false;
      }

      if (assigneeVal) {
        if (assigneeVal === 'me' && t.assignedToId !== Auth.currentUser.id) return false;
        if (assigneeVal !== 'me' && t.assignedToId !== parseInt(assigneeVal)) return false;
      }

      return true;
    });

    this.renderKanbanColumns();
  },

  renderKanbanColumns() {
    const todoList = document.getElementById('list-todo');
    const inProgressList = document.getElementById('list-inprogress');
    const doneList = document.getElementById('list-done');

    if (!todoList || !inProgressList || !doneList) return;

    const todoTasks = this.filteredTasks.filter(t => t.status === 'To Do');
    const inProgressTasks = this.filteredTasks.filter(t => t.status === 'In Progress');
    const doneTasks = this.filteredTasks.filter(t => t.status === 'Done');

    document.getElementById('count-todo').innerText = todoTasks.length;
    document.getElementById('count-inprogress').innerText = inProgressTasks.length;
    document.getElementById('count-done').innerText = doneTasks.length;

    todoList.innerHTML = todoTasks.map(t => this.createTaskCardHtml(t)).join('');
    inProgressList.innerHTML = inProgressTasks.map(t => this.createTaskCardHtml(t)).join('');
    doneList.innerHTML = doneTasks.map(t => this.createTaskCardHtml(t)).join('');
  },

  createTaskCardHtml(task) {
    const isAdmin = this.currentProject.currentUserRole === 'Admin';
    const isAssignedToMe = task.assignedToId === Auth.currentUser.id;
    const canChangeStatus = isAdmin || isAssignedToMe;

    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.dueDate && task.status !== 'Done' && task.dueDate < today;

    return `
      <div class="task-card" draggable="${canChangeStatus ? 'true' : 'false'}"
        ondragstart="Tasks.handleDragStart(event, ${task.id})" id="task-card-${task.id}">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.4rem;">
          <h4 class="task-title">${this.escapeHtml(task.title)}</h4>
          <span class="badge ${this.getPriorityClass(task.priority)}">${task.priority}</span>
        </div>
        
        <p class="task-desc">${this.escapeHtml(task.description || 'No description provided.')}</p>

        <div style="margin-bottom: 0.6rem; font-size:0.8rem; color:var(--text-muted);">
          👤 Assignee: <strong>${task.Assignee ? this.escapeHtml(task.Assignee.name) : 'Unassigned'}</strong>
        </div>

        <div class="task-meta">
          <span class="due-date ${isOverdue ? 'overdue' : ''}">
            📅 ${task.dueDate || 'No due date'} ${isOverdue ? '(Overdue!)' : ''}
          </span>
          <div style="display:flex; gap:0.4rem;">
            ${canChangeStatus ? `
              <select class="form-control" style="padding:0.2rem 0.4rem; font-size:0.75rem; width:auto;"
                onchange="Tasks.updateStatus(${task.id}, this.value)">
                <option value="To Do" ${task.status === 'To Do' ? 'selected' : ''}>To Do</option>
                <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Done" ${task.status === 'Done' ? 'selected' : ''}>Done</option>
              </select>
            ` : ''}

            ${isAdmin ? `
              <button class="btn btn-danger btn-sm" style="padding:0.2rem 0.4rem;" onclick="Tasks.deleteTask(${task.id})">🗑️</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  handleDragStart(e, taskId) {
    e.dataTransfer.setData('text/plain', taskId);
  },

  handleDragOver(e) {
    e.preventDefault();
  },

  async handleDrop(e, newStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    await this.updateStatus(parseInt(taskId), newStatus);
  },

  async updateStatus(taskId, newStatus) {
    try {
      await API.updateTaskStatus(this.currentProject.id, taskId, newStatus);
      App.showToast(`Task moved to ${newStatus}`, 'success');
      await this.refreshTasks();
    } catch (err) {
      App.showToast(err.message, 'error');
      await this.refreshTasks();
    }
  },

  openCreateTaskModal() {
    if (!this.currentProject) return;

    const modalTitle = document.getElementById('modal-task-title');
    if (modalTitle) modalTitle.innerText = `Create Task — ${this.currentProject.name}`;

    const assigneeSelect = document.getElementById('task-assignee-select');
    const isAdmin = this.currentProject.currentUserRole === 'Admin';

    if (assigneeSelect) {
      if (isAdmin) {
        assigneeSelect.disabled = false;
        assigneeSelect.innerHTML = `
          <option value="">Unassigned</option>
          ${(this.currentProject.ProjectMembers || []).map(m => `
            <option value="${m.User.id}">${this.escapeHtml(m.User.name)} (${m.User.email})</option>
          `).join('')}
        `;
      } else {
        // Members can only assign task to themselves
        assigneeSelect.innerHTML = `<option value="${Auth.currentUser.id}">${this.escapeHtml(Auth.currentUser.name)} (Assigned to Self)</option>`;
        assigneeSelect.disabled = true;
      }
    }

    document.getElementById('form-create-task').reset();
    App.openModal('modal-create-task');
  },

  async submitCreateTask() {
    const title = document.getElementById('task-title-input').value;
    const description = document.getElementById('task-desc-input').value;
    const priority = document.getElementById('task-priority-select').value;
    const status = document.getElementById('task-status-select').value;
    const dueDate = document.getElementById('task-duedate-input').value;
    const assignedToId = document.getElementById('task-assignee-select').value;

    if (!title || title.trim() === '') {
      App.showToast('Task title is required.', 'error');
      return;
    }

    try {
      await API.createTask(this.currentProject.id, {
        title,
        description,
        priority,
        status,
        dueDate,
        assignedToId
      });
      App.showToast('Task created successfully!', 'success');
      App.closeModals();
      await this.refreshTasks();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  async deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await API.deleteTask(this.currentProject.id, taskId);
      App.showToast('Task deleted successfully.', 'success');
      await this.refreshTasks();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
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

window.Tasks = Tasks;
