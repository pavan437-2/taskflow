// TaskFlow API Fetch Helper
const API = {
  getToken() {
    return localStorage.getItem('taskflow_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('taskflow_token', token);
    } else {
      localStorage.removeItem('taskflow_token');
    }
  },

  getUser() {
    const userStr = localStorage.getItem('taskflow_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('taskflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('taskflow_user');
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(endpoint, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.setToken(null);
          this.setUser(null);
          if (window.App && window.App.onUnauthorized) {
            window.App.onUnauthorized();
          }
        }
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth Endpoints
  signup(data) {
    return this.request('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) });
  },

  login(data) {
    return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });
  },

  getMe() {
    return this.request('/api/auth/me');
  },

  // Dashboard Endpoint
  getDashboard() {
    return this.request('/api/dashboard');
  },

  // Projects Endpoints
  getProjects() {
    return this.request('/api/projects');
  },

  getProject(id) {
    return this.request(`/api/projects/${id}`);
  },

  createProject(data) {
    return this.request('/api/projects', { method: 'POST', body: JSON.stringify(data) });
  },

  updateProject(id, data) {
    return this.request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  deleteProject(id) {
    return this.request(`/api/projects/${id}`, { method: 'DELETE' });
  },

  // Member Management Endpoints
  addMember(projectId, data) {
    return this.request(`/api/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(data) });
  },

  updateMemberRole(projectId, userId, role) {
    return this.request(`/api/projects/${projectId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  },

  removeMember(projectId, userId) {
    return this.request(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
  },

  // Task Endpoints
  getTasks(projectId) {
    return this.request(`/api/projects/${projectId}/tasks`);
  },

  createTask(projectId, data) {
    return this.request(`/api/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) });
  },

  updateTaskStatus(projectId, taskId, status) {
    return this.request(`/api/projects/${projectId}/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  updateTask(projectId, taskId, data) {
    return this.request(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteTask(projectId, taskId) {
    return this.request(`/api/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
  }
};

window.API = API;
