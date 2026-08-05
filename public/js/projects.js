// TaskFlow Project & Team Management Component
const Projects = {
  currentProject: null,

  async renderList() {
    const container = document.getElementById('view-projects');
    if (!container) return;

    if (!Auth.currentUser) {
      container.innerHTML = `<div class="glass-panel" style="text-align:center;"><p>Please log in to view projects.</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="dashboard-header">
        <div>
          <h2>Projects & Teams</h2>
          <p style="color: var(--text-muted);">Manage your workspaces, invite teammates, and assign roles.</p>
        </div>
        <button class="btn" onclick="App.openCreateProjectModal()">+ Create Project</button>
      </div>
      <div id="projects-container" class="projects-grid">
        <p style="color: var(--text-muted);">Loading projects...</p>
      </div>
    `;

    try {
      const projects = await API.getProjects();
      const grid = document.getElementById('projects-container');

      if (projects.length === 0) {
        grid.innerHTML = `
          <div class="glass-panel" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <h3>No Projects Found</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">You are not a member of any projects yet.</p>
            <button class="btn" onclick="App.openCreateProjectModal()">+ Create Your First Project</button>
          </div>
        `;
        return;
      }

      grid.innerHTML = projects.map(p => `
        <div class="project-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <h3 class="project-title">${this.escapeHtml(p.name)}</h3>
              <span class="badge ${p.currentUserRole === 'Admin' ? 'badge-admin' : 'badge-member'}">
                ${p.currentUserRole}
              </span>
            </div>
            <p class="project-desc">${this.escapeHtml(p.description || 'No description provided.')}</p>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
              Owner: <strong>${this.escapeHtml(p.Owner ? p.Owner.name : 'Unknown')}</strong>
            </div>
            <div class="project-footer">
              <button class="btn btn-secondary btn-sm" onclick="Projects.openProjectDetail(${p.id})">
                View Kanban Board →
              </button>
              ${p.currentUserRole === 'Admin' ? `
                <button class="btn btn-danger btn-sm" onclick="Projects.confirmDeleteProject(${p.id}, '${this.escapeJs(p.name)}')">
                  Delete
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      App.showToast('Failed to load projects: ' + err.message, 'error');
    }
  },

  async openProjectDetail(projectId) {
    try {
      const project = await API.getProject(projectId);
      this.currentProject = project;

      // Switch to Kanban View
      App.navigateTo('kanban');
      Tasks.loadProjectKanban(project);
    } catch (err) {
      App.showToast('Failed to open project: ' + err.message, 'error');
    }
  },

  async openMembersModal(projectId) {
    try {
      const project = await API.getProject(projectId);
      this.currentProject = project;

      const modalTitle = document.getElementById('modal-members-title');
      const membersList = document.getElementById('project-members-list');
      const inviteForm = document.getElementById('form-invite-member');

      if (modalTitle) modalTitle.innerText = `Team Members — ${project.name}`;

      // Only show invite form if user is Admin
      if (inviteForm) {
        inviteForm.style.display = project.currentUserRole === 'Admin' ? 'block' : 'none';
      }

      if (membersList) {
        membersList.innerHTML = project.ProjectMembers.map(m => {
          const isOwner = m.User.id === project.ownerId;
          const isAdmin = project.currentUserRole === 'Admin';
          const isSelf = m.User.id === Auth.currentUser.id;

          return `
            <div class="member-item">
              <div class="member-info">
                <div class="avatar" style="width:32px; height:32px; font-size:0.8rem;">
                  ${m.User.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style="font-weight:600; font-size:0.9rem;">
                    ${this.escapeHtml(m.User.name)} ${isSelf ? '(You)' : ''} ${isOwner ? '👑 Owner' : ''}
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(m.User.email)}</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                ${isAdmin && !isOwner ? `
                  <select class="form-control" style="padding:0.3rem 0.5rem; font-size:0.8rem; width:auto;"
                    onchange="Projects.changeMemberRole(${project.id}, ${m.User.id}, this.value)">
                    <option value="Member" ${m.role === 'Member' ? 'selected' : ''}>Member</option>
                    <option value="Admin" ${m.role === 'Admin' ? 'selected' : ''}>Admin</option>
                  </select>
                ` : `
                  <span class="badge ${m.role === 'Admin' ? 'badge-admin' : 'badge-member'}">${m.role}</span>
                `}

                ${(isAdmin && !isOwner) || (isSelf && !isOwner) ? `
                  <button class="btn btn-danger btn-sm" style="padding:0.25rem 0.5rem;"
                    onclick="Projects.removeMember(${project.id}, ${m.User.id})">
                    ${isSelf ? 'Leave' : 'Remove'}
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
      }

      App.openModal('modal-members');
    } catch (err) {
      App.showToast('Failed to load team members: ' + err.message, 'error');
    }
  },

  async inviteMemberByEmail(projectId) {
    const emailInput = document.getElementById('invite-email');
    const roleSelect = document.getElementById('invite-role');

    if (!emailInput || !emailInput.value) {
      App.showToast('Please enter a valid email address.', 'error');
      return;
    }

    try {
      await API.addMember(projectId, {
        email: emailInput.value,
        role: roleSelect ? roleSelect.value : 'Member'
      });
      App.showToast('Teammate invited successfully!', 'success');
      emailInput.value = '';
      this.openMembersModal(projectId); // Refresh modal
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  async changeMemberRole(projectId, userId, newRole) {
    try {
      await API.updateMemberRole(projectId, userId, newRole);
      App.showToast(`Updated member role to ${newRole}`, 'success');
    } catch (err) {
      App.showToast(err.message, 'error');
      this.openMembersModal(projectId);
    }
  },

  async removeMember(projectId, userId) {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;

    try {
      await API.removeMember(projectId, userId);
      App.showToast('Member removed from project.', 'success');
      if (userId === Auth.currentUser.id) {
        App.closeModals();
        App.navigateTo('projects');
      } else {
        this.openMembersModal(projectId);
      }
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  async confirmDeleteProject(projectId, projectName) {
    if (!confirm(`Are you sure you want to delete the project "${projectName}"? This will permanently delete all associated tasks!`)) return;

    try {
      await API.deleteProject(projectId);
      App.showToast('Project deleted successfully.', 'success');
      this.renderList();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  },

  escapeJs(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'");
  }
};

window.Projects = Projects;
