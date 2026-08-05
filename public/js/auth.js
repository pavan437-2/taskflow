// TaskFlow Auth & User Session Handler
const Auth = {
  currentUser: null,

  init() {
    this.currentUser = API.getUser();
    this.updateUserUI();
    this.bindEvents();
  },

  updateUserUI() {
    const userContainer = document.getElementById('user-profile-nav');
    const authModalBtn = document.getElementById('btn-open-auth');

    if (this.currentUser) {
      if (authModalBtn) authModalBtn.style.display = 'none';
      if (userContainer) {
        userContainer.style.display = 'flex';
        userContainer.innerHTML = `
          <div class="avatar" title="${this.currentUser.email}">
            ${this.currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem;">${this.escapeHtml(this.currentUser.name)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${this.escapeHtml(this.currentUser.email)}</div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-logout" title="Logout">
            Logout
          </button>
        `;

        document.getElementById('btn-logout').addEventListener('click', () => this.logout());
      }
    } else {
      if (userContainer) userContainer.style.display = 'none';
      if (authModalBtn) authModalBtn.style.display = 'inline-flex';
    }
  },

  bindEvents() {
    // Tab switcher inside Auth Modal (Login vs Signup)
    const tabLogin = document.getElementById('tab-auth-login');
    const tabSignup = document.getElementById('tab-auth-signup');
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');

    if (tabLogin && tabSignup) {
      tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        formLogin.style.display = 'block';
        formSignup.style.display = 'none';
      });

      tabSignup.addEventListener('click', () => {
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        formSignup.style.display = 'block';
        formLogin.style.display = 'none';
      });
    }

    // Login Form Submission
    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
          const res = await API.login({ email, password });
          API.setToken(res.token);
          API.setUser(res.user);
          this.currentUser = res.user;
          this.updateUserUI();
          App.closeModals();
          App.showToast('Login successful!', 'success');
          App.navigateTo('dashboard');
        } catch (err) {
          App.showToast(err.message, 'error');
        }
      });
    }

    // Signup Form Submission
    if (formSignup) {
      formSignup.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        try {
          const res = await API.signup({ name, email, password });
          API.setToken(res.token);
          API.setUser(res.user);
          this.currentUser = res.user;
          this.updateUserUI();
          App.closeModals();
          App.showToast('Account created successfully!', 'success');
          App.navigateTo('dashboard');
        } catch (err) {
          App.showToast(err.message, 'error');
        }
      });
    }

    // Demo Account Buttons
    const btnDemoAdmin = document.getElementById('btn-demo-admin');
    const btnDemoMember = document.getElementById('btn-demo-member');

    if (btnDemoAdmin) {
      btnDemoAdmin.addEventListener('click', () => this.loginAsDemo('admin@taskflow.com', 'password123'));
    }

    if (btnDemoMember) {
      btnDemoMember.addEventListener('click', () => this.loginAsDemo('member@taskflow.com', 'password123'));
    }
  },

  async loginAsDemo(email, password) {
    try {
      const res = await API.login({ email, password });
      API.setToken(res.token);
      API.setUser(res.user);
      this.currentUser = res.user;
      this.updateUserUI();
      App.closeModals();
      App.showToast(`Logged in as demo user (${res.user.name})`, 'success');
      App.navigateTo('dashboard');
    } catch (err) {
      App.showToast('Demo login failed. Make sure database is seeded.', 'error');
    }
  },

  logout() {
    API.setToken(null);
    API.setUser(null);
    this.currentUser = null;
    this.updateUserUI();
    App.showToast('Logged out successfully', 'success');
    App.openAuthModal();
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }
};

window.Auth = Auth;
