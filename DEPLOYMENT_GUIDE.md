# LSRW System - Deployment Guide

## Pre-Deployment Checklist

- [ ] Database backup created
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Environment variables configured (.env)
- [ ] DATABASE_URL configured in .env
- [ ] MySQL server running and accessible
- [ ] Node.js v14+ installed
- [ ] npm v6+ installed

---

## Step-by-Step Deployment

### 1. **Database Setup**

#### Option A: Fresh Database (Recommended for Development)

```bash
# Navigate to backend directory
cd backend

# Run Prisma migration to create all tables
npm run prisma migrate dev --name add_lsrw_comprehensive_features

# This will:
# - Create all new tables (Group, GroupMembership, TaskDepartmentAssignment, etc.)
# - Create all enums (ListeningSubType, SpeakingSubType, etc.)
# - Update existing tables (Task, User, Department, Organization)
# - Generate Prisma Client
```

#### Option B: Existing Database (Production)

```bash
# Generate Prisma Client without running migration
npm run prisma generate

# Then manually run the migration SQL in your database admin tool
# Or use:
npm run prisma migrate deploy
```

#### Verify Schema

```bash
# Check if all tables exist
npm run prisma db execute --stdin < verify_schema.sql

# Or use interactive Prisma studio
npm run prisma studio
```

---

### 2. **Backend Setup**

```bash
# Install dependencies
npm install

# Create .env file with required variables
cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=lsrw
DATABASE_URL="mysql://root:your_password@localhost:3306/lsrw"
JWT_SECRET="your_super_secret_jwt_key"
PORT=5000
NODE_ENV=development
EOF

# Start backend server
npm start
# Expected output: "Backend running on port 5000"
```

---

### 3. **Frontend Setup**

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Verify API endpoint in api.js
# Should point to http://localhost:5000

# Start frontend development server
npm start
# Expected: Opens browser at http://localhost:3000
```

---

### 4. **Verify Installation**

#### Backend Verification
```bash
# Test API health
curl http://localhost:5000/api/tasks \
  -H "Authorization: Bearer test_token"

# Should return 401 or empty array (depending on auth middleware)
```

#### Frontend Verification
- [ ] Access http://localhost:3000
- [ ] See login page
- [ ] Components load without errors (check browser console)

#### Database Verification
```bash
# Connect to MySQL
mysql -u root -p lsrw

# List tables
SHOW TABLES;

# Should include: task, group, groupmembership, user, department, etc.
```

---

## Initial Data Setup

### Create Default Organization

```bash
# Use Prisma Studio or API to create first organization
npm run prisma studio

# Then insert:
# INSERT INTO organization (id, name, subdomain, status)
# VALUES ('org-001', 'Test University', 'test-university', 'ACTIVE')
```

### Create Default Users

```sql
-- Create Super Admin (hash password with bcrypt)
INSERT INTO user (id, email, password, firstName, lastName, role, organizationId, status)
VALUES ('admin-001', 'admin@example.com', 'hashed_password', 'Admin', 'User', 'SUPER_ADMIN', 'org-001', 'ACTIVE');

-- Create Organization Admin
INSERT INTO user (id, email, password, firstName, lastName, role, organizationId, status)
VALUES ('org-admin-001', 'org-admin@example.com', 'hashed_password', 'Org', 'Admin', 'ADMIN', 'org-001', 'ACTIVE');

-- Create Department Admin
INSERT INTO user (id, email, password, firstName, lastName, role, organizationId, department, status)
VALUES ('dept-admin-001', 'dept-admin@example.com', 'hashed_password', 'Dept', 'Admin', 'DEPT_ADMIN', 'org-001', 'CSE', 'ACTIVE');

-- Create Teacher
INSERT INTO user (id, email, password, firstName, lastName, role, organizationId, status)
VALUES ('teacher-001', 'teacher@example.com', 'hashed_password', 'John', 'Teacher', 'TEACHER', 'org-001', 'ACTIVE');

-- Create Student
INSERT INTO user (id, email, password, firstName, lastName, role, organizationId, department, status)
VALUES ('student-001', 'student@example.com', 'hashed_password', 'Jane', 'Student', 'STUDENT', 'org-001', 'CSE', 'ACTIVE');
```

### Create Default Departments

```sql
INSERT INTO department (id, name, status, organizationId, adminId)
VALUES ('dept-001', 'Computer Science', 'ACTIVE', 'org-001', 'dept-admin-001');

INSERT INTO department (id, name, status, organizationId, adminId)
VALUES ('dept-002', 'Electronics', 'ACTIVE', 'org-001', NULL);
```

### Create Default Group

```sql
INSERT INTO `group` (id, name, description, academicYear, departmentId, organizationId, ownerId, status)
VALUES ('group-001', 'Class A1 - 2024', 'First year CS batch', '2024-2025', 'dept-001', 'org-001', 'teacher-001', 'ACTIVE');

INSERT INTO groupmembership (id, userId, groupId, role)
VALUES ('gm-001', 'teacher-001', 'group-001', 'OWNER');

INSERT INTO groupmembership (id, userId, groupId, role)
VALUES ('gm-002', 'student-001', 'group-001', 'MEMBER');
```

---

## Production Deployment

### Environment Configuration

Update `.env` for production:

```bash
NODE_ENV=production
DB_HOST=production-db-host
DB_PORT=3306
DB_USER=prod_user
DB_PASS=strong_password_here
DB_NAME=lsrw_prod
DATABASE_URL="mysql://prod_user:strong_password@prod-db-host:3306/lsrw_prod"
JWT_SECRET="use_very_long_random_string"
PORT=5000
API_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com
```

### Deployment Steps

#### Using Docker (Recommended)

**Dockerfile for Backend:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run prisma generate

EXPOSE 5000

CMD ["npm", "start"]
```

**Dockerfile for Frontend:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASS}
      MYSQL_DATABASE: ${DB_NAME}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mysql
    ports:
      - "5000:5000"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

**Deploy with Docker Compose:**
```bash
docker-compose up -d
```

#### Using Traditional Server

```bash
# SSH into server
ssh user@server

# Clone repository
git clone https://github.com/your-repo/LSRW.git
cd LSRW

# Setup backend
cd backend
npm install
npm run prisma migrate deploy
npm start &

# Setup frontend (in another terminal)
cd ../frontend
npm install
npm run build
npm install -g serve
serve -s build -l 3000 &

# Setup reverse proxy (nginx)
# Create nginx config pointing to:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000/api
```

---

## Post-Deployment Verification

### Health Checks

```bash
# Backend health
curl http://localhost:5000/api/tasks \
  -H "Authorization: Bearer dummy_token" \
  -I

# Should return 200 or 401 (not 500)

# Frontend health
curl http://localhost:3000 \
  -I

# Should return 200
```

### Smoke Tests

1. **Login**: Can users authenticate?
2. **Create Group**: Can teacher create a group?
3. **Create Task**: Can teacher create a listening task?
4. **View Task**: Can student see assigned task?
5. **Submit Response**: Can student submit response?

### Log Monitoring

```bash
# Backend logs
tail -f backend.log

# Frontend logs (browser console)
F12 -> Console tab

# Database logs (if needed)
tail -f /var/log/mysql/error.log
```

---

## Troubleshooting

### Issue: "Cannot find module 'prisma'"

**Solution:**
```bash
npm install
npm run prisma generate
```

### Issue: "Connection refused" to database

**Solution:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Or start it
sudo systemctl start mysql

# Verify connection
mysql -u root -p -h localhost
```

### Issue: "JWT invalid" errors

**Solution:**
- Ensure JWT_SECRET is set in .env
- Same JWT_SECRET should be used across all deployed instances
- Regenerate tokens after changing JWT_SECRET

### Issue: "Task not visible to students"

**Solution:**
- Verify task status is PUBLISHED
- Check visibility scope matches student's access level
- Verify student is in correct group/department
- Check audit logs for role verification

### Issue: CORS errors

**Solution:**
- Verify backend has CORS enabled
- Check FRONTEND_URL in backend .env
- Ensure API_URL in frontend config is correct

---

## Monitoring & Maintenance

### Regular Tasks

**Daily:**
- Check error logs
- Verify API response times
- Monitor database disk space

**Weekly:**
- Review audit logs
- Verify all background jobs run
- Check for security updates

**Monthly:**
- Database backup
- Performance analysis
- User feedback review

### Backup Strategy

```bash
# Daily backup
mysqldump -u root -p lsrw > backups/lsrw_$(date +%Y%m%d).sql

# Automated backup (cron)
0 2 * * * mysqldump -u root -pPASSWORD lsrw > /backups/lsrw_$(date +\%Y\%m\%d).sql
```

### Performance Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_task_createdby ON task(createdById);
CREATE INDEX idx_group_owner ON `group`(ownerId);
CREATE INDEX idx_group_membership_user ON groupmembership(userId);
CREATE INDEX idx_task_visibility ON task(visibilityScope);
```

---

## Rollback Procedure

If deployment fails:

```bash
# Stop services
docker-compose down
# OR
pkill -f "node server.js"
pkill -f "npm start"

# Restore database backup
mysql -u root -p lsrw < backups/lsrw_backup.sql

# Redeploy previous version
git checkout previous-tag
docker-compose up -d
# OR
npm start
```

---

## Support

For issues:
1. Check logs first
2. Review QUICK_REFERENCE.md
3. Check IMPLEMENTATION_SUMMARY.md
4. Create issue with:
   - Error message
   - Relevant logs
   - Steps to reproduce
   - User role and browser

---

**Deployment Guide Version:** 1.0
**Last Updated:** June 2026
