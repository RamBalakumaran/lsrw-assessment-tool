# LSRW System - Quick Reference Guide

## API Endpoints Quick Reference

### Groups
```bash
# Create group
POST /api/groups
{
  "name": "Class A1",
  "departmentId": "dept-123",
  "academicYear": "2024-2025",
  "section": "A1"
}

# Get all groups (filtered by role)
GET /api/groups

# Add members to group (owner only)
POST /api/groups/{groupId}/members
{
  "userIds": ["user-1", "user-2"],
  "role": "COLLABORATOR"
}

# Add students to group
POST /api/groups/{groupId}/students
{
  "studentIds": ["student-1", "student-2"]
}

# Remove member
DELETE /api/groups/{groupId}/members/{memberId}

# Update group
PUT /api/groups/{groupId}
{
  "name": "Updated Class A1",
  "status": "ACTIVE"
}

# Delete group
DELETE /api/groups/{groupId}
```

### Tasks

```bash
# Create task
POST /api/tasks
{
  "title": "English Grammar Basics",
  "type": "READING",
  "subType": "COMPREHENSION_MCQ",
  "passage": "...",
  "difficulty": "INTERMEDIATE",
  "visibilityScope": "ORGANIZATION",
  "questions": [...]
}

# Get accessible tasks
GET /api/tasks?type=READING&status=PUBLISHED

# Get specific task
GET /api/tasks/{taskId}

# Publish task (DRAFT → PUBLISHED)
PATCH /api/tasks/{taskId}/publish

# Update draft task
PUT /api/tasks/{taskId}
{
  "title": "Updated Title",
  "description": "Updated description"
}

# Delete draft task
DELETE /api/tasks/{taskId}
```

---

## Frontend Components Usage

### TaskCreationForm
```jsx
import TaskCreationForm from './components/TaskCreationForm';

<TaskCreationForm 
  userRole="TEACHER"
  userId="user-123"
  onTaskCreated={(task) => console.log('Created:', task)}
/>
```

Features:
- 3-step wizard for task creation
- 26 task subtypes
- Dynamic field rendering
- Real-time validation
- Support for all visibility scopes

### GroupManagement
```jsx
import GroupManagement from './components/GroupManagement';

<GroupManagement />
```

Features:
- Create, edit, delete groups
- Add members and students
- View group details
- Role-based access

---

## Task Subtype Matrix

| Skill | Subtype | Key Fields | Example |
|-------|---------|-----------|---------|
| **LISTENING** | MCQ_AUDIO | audioUrl, questions | News audio + 4 questions |
| | FILL_BLANKS_AUDIO | audioUrl, questions | Listen and complete sentences |
| | NOTE_TAKING | audioUrl, instructions | Lecture with notes |
| | LISTENING_GIST | audioUrl, questions | What's the main idea? |
| | LISTENING_DETAILS | audioUrl, questions | Specific facts from audio |
| | DICTATION | audioUrl, questions | Type what you hear |
| | MATCHING_AUDIO | audioUrl, questions | Match audio to response |
| **SPEAKING** | SELF_INTRODUCTION | instructions, timeLimit | Introduce in 2 min |
| | PICTURE_DESCRIPTION | instructions, timeLimit | Describe image in 1 min |
| | READ_ALOUD | passage, timeLimit | Read passage aloud |
| | ANSWER_QUESTIONS | instructions, timeLimit | Answer 3 questions |
| | REPEAT_SENTENCES | audioUrl | Repeat 5 sentences |
| **READING** | COMPREHENSION_MCQ | passage, questions | Passage + 5 MCQ |
| | TRUE_FALSE | passage, questions | 5 True/False statements |
| | FILL_BLANKS | passage, questions | Complete sentences |
| | MATCHING_HEADINGS | passage, questions | Match headings to paras |
| | SKIMMING | passage, instructions | Find main idea in 2 min |
| | SCANNING | passage, instructions | Find specific facts |
| | VOCABULARY | passage, questions | Define words in context |
| **WRITING** | ESSAY | instructions, rubric | Write 500-word essay |
| | PARAGRAPH | instructions | Write one paragraph |
| | LETTER_EMAIL | instructions | Write formal email |
| | STORY_COMPLETION | passage, instructions | Complete the story |
| | SUMMARIZATION | passage | Summarize in 200 words |
| | GRAMMAR_CORRECTION | passage, questions | Correct 10 errors |
| | REPORT | instructions, rubric | Write report on topic |

---

## Role-Based Permissions

### What Each Role Can Do

**STUDENT:**
- View assigned tasks (ORG, DEPARTMENT, GROUP)
- Submit responses
- View own scores

**TEACHER:**
- Create GROUP-scope tasks for own groups
- Add collaborators to own groups
- Manage own students
- View evaluations for assigned groups
- Edit/delete own draft tasks

**DEPT_ADMIN:**
- Create DEPARTMENT-scope tasks
- Manage own department groups
- View all department tasks
- Manage department staff
- Cannot assign tasks outside department

**ADMIN:**
- Create ORGANIZATION-scope tasks
- Create DEPARTMENT-scope tasks
- Manage all departments
- Manage all groups
- View all tasks and attempts

**SUPER_ADMIN:**
- Create GLOBAL-scope tasks
- Manage all organizations
- Full access to everything

---

## Implementation Checklist

- [x] Database schema updated
- [x] Group management API
- [x] Task creation with visibility scopes
- [x] RBAC enforcement
- [x] Audit logging
- [x] Frontend components
- [x] Documentation
- [ ] **Database migration** (TODO: Run manually or auto-deploy)
- [ ] Integration testing
- [ ] Production deployment

---

## Key Files

**Backend:**
- `backend/routes/tasks.js` - Task creation and management
- `backend/routes/groups.js` - Group management
- `backend/prisma/schema.prisma` - Database schema
- `backend/server.js` - Server configuration

**Frontend:**
- `frontend/components/TaskCreationForm.jsx` - Task creation UI
- `frontend/components/GroupManagement.jsx` - Group management UI

**Documentation:**
- `LSRW_TASK_SYSTEM_GUIDE.md` - Complete system guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation summary

---

## Error Handling

### Common Errors & Solutions

**400 Bad Request**
- Cause: Missing required fields or invalid input
- Solution: Check required fields for task subtype

**403 Forbidden**
- Cause: User lacks permission
- Solution: Verify user role and resource ownership

**404 Not Found**
- Cause: Resource doesn't exist
- Solution: Verify resource ID and user access

**500 Server Error**
- Cause: Server-side error
- Solution: Check server logs and database connection

---

## Testing Commands

```bash
# Create Listening MCQ task
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "News Listening",
    "type": "LISTENING",
    "subType": "MCQ_AUDIO",
    "audioUrl": "https://example.com/news.mp3",
    "visibilityScope": "ORGANIZATION",
    "questions": [{"questionText": "What is the topic?", ...}]
  }'

# Create group
curl -X POST http://localhost:5000/api/groups \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Class A1",
    "departmentId": "dept-123",
    "academicYear": "2024-2025"
  }'

# Get all tasks
curl http://localhost:5000/api/tasks \
  -H "Authorization: Bearer {token}"
```

---

**Last Updated:** June 2026
**Quick Reference Version:** 1.0
