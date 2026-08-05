// TaskFlow Main Application Router & Event Controller
const App = {
  currentView: 'dashboard',

  init() {
    Auth.init();
    this.bindGlobalEvents();

    // Check URL or default view
    if (!Auth.currentUser) {
      this.openAuthModal();
    } else {
      this.navigateTo('dashboard');
    }
  },

  navigateTo(viewName) {
    this.currentView = viewName;

    // Update Nav Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.dataset.view === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update View Panels
    document.querySelectorAll('.view').forEach(view => {
      if (view.id === `view-${viewName}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Render View Content
    if (viewName === 'dashboard') {
      Dashboard.render();
    } else if (viewName === 'projects') {
      Projects.renderList();
    } else if (viewName === 'kanban') {
      if (!Tasks.currentProject) {
        this.navigateTo('projects');
      }
    }
  },

  bindGlobalEvents() {
    // Navigation link clicks
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view) this.navigateTo(view);
      });
    });

    // Auth Modal trigger
    const authBtn = document.getElementById('btn-open-auth');
    if (authBtn) {
      authBtn.addEventListener('click', () => this.openAuthModal());
    }

    // Modal Close Buttons & Backdrop Clicks
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          this.closeModals();
        }
      });
    });

    // Create Project Form Submit
    const formProject = document.getElementById('form-create-project');
    if (formProject) {
      formProject.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('project-name-input').value;
        const description = document.getElementById('project-desc-input').value;

        try {
          const newProj = await API.createProject({ name, description });
          this.showToast('Project created successfully!', 'success');
          this.closeModals();
          formProject.reset();
          Projects.openProjectDetail(newProj.id);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }

    // Create Task Form Submit
    const formTask = document.getElementById('form-create-task');
    if (formTask) {
      formTask.addEventListener('submit', (e) => {
        e.preventDefault();
        Tasks.submitCreateTask();
      });
    }

    // Invite Member Form Submit
    const formInvite = document.getElementById('form-invite-member');
    if (formInvite) {
      formInvite.addEventListener('submit', (e) => {
        e.preventDefault();
        if (Projects.currentProject) {
          Projects.inviteMemberByEmail(Projects.currentProject.id);
        }
      });
    }
  },

  openAuthModal() {
    this.openModal('modal-auth');
  },

  openCreateProjectModal() {
    if (!Auth.currentUser) {
      this.openAuthModal();
      return;
    }
    this.openModal('modal-create-project');
  },

  openModal(modalId) {
    this.closeModals();
    const backdrop = document.getElementById(modalId);
    if (backdrop) {
      backdrop.classList.add('active');
    }
  },

  closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(b => b.classList.remove('active'));
  },

  onUnauthorized() {
    this.showToast('Session expired. Please log in again.', 'error');
    Auth.updateUserUI();
    this.openAuthModal();
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <div>${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
