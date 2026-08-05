# TaskFlow — Project & Task Management with Role-Based Access Control (RBAC)

A modern full-stack web application for creating projects, inviting teammates, assigning tasks, and tracking progress with Admin / Member role-based access control.

---

## 🚀 Live Demo & Repository
- **GitHub Repository**: `https://github.com/your-username/taskflow`
- **Live Railway URL**: `https://taskflow-production.up.railway.app` *(Replace with your deployed URL)*

---

## ✨ Features Overview

1. **Authentication & JWT Sessions**:
   - User registration & login with bcrypt password hashing.
   - JWT-authenticated stateless sessions.
   - One-click demo login buttons for testing (`Admin` and `Member`).

2. **Project & Team Management**:
   - Create, edit, and delete projects (Admin).
   - Invite members by email address.
   - Dynamic Role Management: Promote/demote members between `Admin` ↔ `Member`.
   - Remove members or leave projects safely.

3. **Task Management & Kanban Board**:
   - Interactive Kanban Board (`To Do`, `In Progress`, `Done`).
   - Create, edit, assign, and delete tasks.
   - Priorities (`Low`, `Medium`, `High`, `Urgent`), due dates, and real-time status transitions.
   - Multi-field filters (search by title, filter by priority, filter by assignee).

4. **Role-Based Access Control (RBAC)**:
   - **Admin**: Full control — edit/delete projects, manage team members & roles, create/assign/edit/delete any task in the project.
   - **Member**: View projects & tasks, create tasks (only assignable to themselves), and update the status of tasks assigned to them.

5. **Dashboard Analytics**:
   - Tasks assigned to user across all projects.
   - Status counters (`To Do`, `In Progress`, `Done`).
   - **Overdue Tasks Callout**: Visual banner highlighting tasks past due dates.

6. **Input Validation**:
   - Server-side validations on every endpoint (email format, password length, required fields, valid enum values, project-membership checks before task assignment).

---

## ⚙️ Tech Stack

- **Backend**: Node.js & Express.js REST API
- **ORM & Database**: Sequelize ORM (`sqlite3` locally zero-config → PostgreSQL in production)
- **Security**: JWT (`jsonwebtoken`), `bcryptjs` password hashing, CORS
- **Frontend**: Single-Page App built with Vanilla HTML5, CSS3 (Glassmorphism design system), and Vanilla JavaScript (Zero build step or framework required)
- **Deployment**: Railway (Native Node.js Nixpacks, `npm start`, zero Docker containerization needed)

---

## 📁 Project Structure

```
taskflow/
├── config/
│   └── db.js                 # Sequelize connection (SQLite locally, Postgres in prod)
├── models/
│   ├── index.js              # Model definitions & associations
│   ├── user.model.js
│   ├── project.model.js
│   ├── projectMember.model.js
│   └── task.model.js
├── middleware/
│   ├── auth.js               # JWT verification
│   └── projectAccess.js      # Loads membership & enforces Admin/Member RBAC rules
├── routes/
│   ├── auth.routes.js        # /api/auth/*
│   ├── project.routes.js     # /api/projects/*
│   ├── task.routes.js        # /api/projects/:projectId/tasks/*
│   ├── dashboard.routes.js   # /api/dashboard
│   └── user.routes.js        # /api/users
├── public/                   # Frontend SPA (HTML/CSS/JS)
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── dashboard.js
│       ├── projects.js
│       ├── tasks.js
│       └── app.js
├── server.js                  # App entry point & database sync
├── seed.js                    # Database seeder for demo accounts
├── Procfile                   # Railway deployment process command
├── package.json
└── .env.example
```

---

## 💻 Local Setup & Quick Start

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/taskflow.git
   cd taskflow
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```env
   PORT=3000
   JWT_SECRET=taskflow_secret_jwt_key_2026
   NODE_ENV=development
   ```

4. **Seed Demo Data**:
   Populate SQLite database with demo accounts, projects, and sample tasks:
   ```bash
   npm run seed
   ```

   **Default Demo Accounts**:
   - **Admin**: `admin@taskflow.com` | Password: `password123`
   - **Member**: `member@taskflow.com` | Password: `password123`
   - **Member 2**: `jordan@taskflow.com` | Password: `password123`

5. **Start the Application**:
   ```bash
   npm start
   ```
   Open `http://localhost:3000` in your web browser.

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Feature / Permission | Project Admin | Project Member |
| :--- | :---: | :---: |
| View Project & Tasks | ✅ | ✅ |
| Edit / Delete Project | ✅ | ❌ |
| Invite Teammates by Email | ✅ | ❌ |
| Promote / Demote Member Roles | ✅ | ❌ |
| Remove Members from Project | ✅ | ❌ |
| Create Task (Assign to Anyone) | ✅ | ❌ |
| Create Task (Self Assign) | ✅ | ✅ |
| Update Status of Assigned Tasks | ✅ | ✅ |
| Update Status of Other's Tasks | ✅ | ❌ |
| Delete Tasks | ✅ | ❌ |

---

## 🔌 REST API Documentation

### Auth Routes (`/api/auth`)
- `POST /api/auth/signup` - Register a new account (`name`, `email`, `password`)
- `POST /api/auth/login` - Authenticate & obtain JWT (`email`, `password`)
- `GET /api/auth/me` - Get logged-in user profile

### Project Routes (`/api/projects`)
- `GET /api/projects` - List all projects where user is a member
- `POST /api/projects` - Create a new project (Creator becomes Owner & Admin)
- `GET /api/projects/:id` - Get project details & team member list
- `PUT /api/projects/:id` - Update project details (Admin only)
- `DELETE /api/projects/:id` - Delete project (Admin only)
- `POST /api/projects/:id/members` - Invite member by email (Admin only)
- `PATCH /api/projects/:id/members/:userId` - Update member role (Admin only)
- `DELETE /api/projects/:id/members/:userId` - Remove member (Admin only or self)

### Task Routes (`/api/projects/:projectId/tasks`)
- `GET /api/projects/:projectId/tasks` - List tasks in project
- `POST /api/projects/:projectId/tasks` - Create task
- `PATCH /api/projects/:projectId/tasks/:taskId/status` - Update status (`To Do`, `In Progress`, `Done`)
- `PUT /api/projects/:projectId/tasks/:taskId` - Update task details
- `DELETE /api/projects/:projectId/tasks/:taskId` - Delete task (Admin only)

### Dashboard Routes (`/api/dashboard`)
- `GET /api/dashboard` - Get personal metrics, assigned tasks, overdue tasks callout

---

## 🌐 Railway Deployment Guide (No Docker Required)

TaskFlow deploys natively to Railway using Node.js Nixpacks.

### Step-by-Step Instructions:

1. **Push Code to GitHub**:
   Push your TaskFlow code to a GitHub repository.

2. **Create New Project on Railway**:
   - Log in to [Railway.app](https://railway.app).
   - Click **+ New Project** -> Select **Deploy from GitHub repo**.
   - Choose your `taskflow` repository.

3. **Add PostgreSQL Database**:
   - In your Railway project canvas, click **+ New** -> Select **Database** -> **PostgreSQL**.
   - Railway will automatically provision a PostgreSQL database and create a `DATABASE_URL` variable.

4. **Configure Environment Variables**:
   Under your TaskFlow Web Service -> **Variables**, add:
   - `JWT_SECRET` = `your_super_secret_jwt_key`
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (Railway references database automatically)

5. **Deploy & Seed Database**:
   - Railway will detect `package.json` and build the app using `npm start`.
   - To seed initial demo data in production, run `npm run seed` via Railway CLI or shell console.

6. **Generate Public Domain**:
   - Go to Service Settings -> **Networking** -> Click **Generate Domain**.
   - Your TaskFlow app is now live!
