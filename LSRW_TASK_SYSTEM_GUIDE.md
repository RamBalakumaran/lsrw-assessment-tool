# LSRW Task Management System - Implementation Guide

## Overview

This document provides comprehensive guidance on implementing and using the LSRW (Listening, Speaking, Reading, Writing) task management system with Role-Based Access Control (RBAC) and visibility scopes.

---

## 1. Task Types and Subtypes

### 🎧 LISTENING Tasks

| Subtype | Required Fields | Description |
|---------|-----------------|-------------|
| **MCQ_AUDIO** | title, audioUrl | Multiple choice questions based on audio |
| **FILL_BLANKS_AUDIO** | title, audioUrl | Fill blanks while listening |
| **NOTE_TAKING** | title, audioUrl, instructions | Take notes from audio lecture |
| **LISTENING_GIST** | title, audioUrl | Identify main idea from audio |
| **LISTENING_DETAILS** | title, audioUrl | Identify specific details from audio |
| **DICTATION** | title, audioUrl | Write what you hear |
| **MATCHING_AUDIO** | title, audioUrl | Match audio to correct options |

**Audio Upload Example:**
```json
{
  "title": "English News Broadcast",
  "type": "LISTENING",
  "subType": "MCQ_AUDIO",
  "audioUrl": "https://storage.example.com/audio/news.mp3",
  "audioFileName": "news.mp3",
  "questions": [
    {
      "questionText": "What is the main topic?",
      "options": ["A: Politics", "B: Sports", "C: Weather"],
      "correctAnswer": "A",
      "time": 30
    }
  ]
}
```

---

### 🗣️ SPEAKING Tasks

| Subtype | Required Fields | Description |
|---------|-----------------|-------------|
| **SELF_INTRODUCTION** | title, instructions, timeLimit | Introduce yourself |
| **PICTURE_DESCRIPTION** | title, instructions, timeLimit | Describe a picture |
| **READ_ALOUD** | title, passage, timeLimit | Read passage aloud |
| **ANSWER_QUESTIONS** | title, instructions, timeLimit | Answer spoken questions |
| **REPEAT_SENTENCES** | title, audioUrl | Repeat sentences for pronunciation |

**Speaking Task Example:**
```json
{
  "title": "Self Introduction",
  "type": "SPEAKING",
  "subType": "SELF_INTRODUCTION",
  "instructions": "Introduce yourself in 2-3 minutes. Include your name, background, and interests.",
  "timeLimit": 180,
  "evaluationRubric": {
    "pronunciation": { "weight": 30, "levels": ["poor", "fair", "good", "excellent"] },
    "fluency": { "weight": 30, "levels": ["poor", "fair", "good", "excellent"] },
    "grammar": { "weight": 25, "levels": ["poor", "fair", "good", "excellent"] },
    "vocabulary": { "weight": 15, "levels": ["poor", "fair", "good", "excellent"] }
  }
}
```

---

### 📖 READING Tasks

| Subtype | Required Fields | Description |
|---------|-----------------|-------------|
| **COMPREHENSION_MCQ** | title, passage | MCQs on passage comprehension |
| **TRUE_FALSE** | title, passage | True/False questions |
| **FILL_BLANKS** | title, passage | Fill blanks in passage |
| **MATCHING_HEADINGS** | title, passage | Match headings to paragraphs |
| **SKIMMING** | title, passage, instructions | Quick reading for main idea |
| **SCANNING** | title, passage, instructions | Search for specific information |
| **VOCABULARY** | title, passage | Vocabulary from context |

**Reading Task Example:**
```json
{
  "title": "Digital Privacy Issues",
  "type": "READING",
  "subType": "COMPREHENSION_MCQ",
  "passage": "In the digital age, privacy has become increasingly important...",
  "questions": [
    {
      "questionText": "According to the passage, what is the main concern?",
      "options": ["A: Data collection", "B: Internet speed", "C: Email security"],
      "correctAnswer": "A",
      "questionType": "MCQ"
    }
  ]
}
```

---

### ✍️ WRITING Tasks

| Subtype | Required Fields | Description |
|---------|-----------------|-------------|
| **ESSAY** | title, instructions, evaluationRubric | Write an essay |
| **PARAGRAPH** | title, instructions | Write a paragraph |
| **LETTER_EMAIL** | title, instructions | Write formal letter/email |
| **STORY_COMPLETION** | title, passage, instructions | Complete a story |
| **SUMMARIZATION** | title, passage | Summarize a passage |
| **GRAMMAR_CORRECTION** | title, passage | Correct grammar errors |
| **REPORT** | title, instructions, evaluationRubric | Write a report |

**Writing Task Example:**
```json
{
  "title": "Write an Essay on Technology Impact",
  "type": "WRITING",
  "subType": "ESSAY",
  "instructions": "Write a 500-word essay on how technology impacts modern education.",
  "evaluationRubric": {
    "content": { "weight": 40, "levels": ["poor", "fair", "good", "excellent"] },
    "organization": { "weight": 30, "levels": ["poor", "fair", "good", "excellent"] },
    "grammar": { "weight": 20, "levels": ["poor", "fair", "good", "excellent"] },
    "vocabulary": { "weight": 10, "levels": ["poor", "fair", "good", "excellent"] }
  }
}
```

---

## 2. Visibility Scopes

### Scope Types

1. **GLOBAL** (Super Admin only)
   - Visible to all students across all organizations
   - Only Super Admin can create

2. **ORGANIZATION**
   - Visible to all students within the organization
   - Created by: Super Admin, Organization Admin

3. **DEPARTMENT**
   - Visible to students in specific departments
   - Created by: Organization Admin, Department Admin
   - Requires: `departmentIds` array

4. **GROUP**
   - Visible to students in specific groups
   - Created by: Teachers (for their groups), Department/Organization Admin
   - Requires: `groupIds` array (user must be owner/collaborator)

### Example: Creating Department-Scoped Task
```json
POST /api/tasks
{
  "title": "CSE Department - C Programming",
  "type": "READING",
  "subType": "COMPREHENSION_MCQ",
  "passage": "...",
  "visibilityScope": "DEPARTMENT",
  "departmentIds": ["dept-id-1", "dept-id-2"],
  "questions": [...]
}
```

### Example: Creating Group-Scoped Task
```json
POST /api/tasks
{
  "title": "Class A1 - Speaking Practice",
  "type": "SPEAKING",
  "subType": "SELF_INTRODUCTION",
  "instructions": "...",
  "visibilityScope": "GROUP",
  "groupIds": ["group-id-1"],
  "questions": [...]
}
```

---

## 3. Role-Based Access Control

### Task Creation Permissions

| Role | GLOBAL | ORGANIZATION | DEPARTMENT | GROUP |
|------|--------|--------------|------------|-------|
| **SUPER_ADMIN** | ✅ | ✅ | ✅ | ❌ |
| **ADMIN** | ❌ | ✅ | ✅ | ❌ |
| **DEPT_ADMIN** | ❌ | ❌ | ✅ (own) | ❌ |
| **TEACHER** | ❌ | ❌ | ❌ | ✅ (own groups) |
| **STUDENT** | ❌ | ❌ | ❌ | ❌ |

### Task Visibility Permissions

| Role | Sees |
|------|------|
| **SUPER_ADMIN** | All tasks |
| **ADMIN** | All org tasks |
| **DEPT_ADMIN** | Org + Department tasks |
| **TEACHER** | Organization + Group tasks they own/collaborate + their own |
| **STUDENT** | Organization + Department (their dept) + Group (member) tasks |

---

## 4. Group Management

### Creating a Group

```json
POST /api/groups
{
  "name": "Class A1 - Batch 2024",
  "description": "First year students",
  "academicYear": "2024-2025",
  "section": "A1",
  "departmentId": "dept-123",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "id": "group-123",
  "name": "Class A1 - Batch 2024",
  "ownerId": "teacher-456",
  "members": [
    {
      "userId": "teacher-456",
      "role": "OWNER",
      "user": { "id": "teacher-456", "email": "teacher@school.com" }
    }
  ]
}
```

### Adding Collaborators to Group

```json
POST /api/groups/{groupId}/members
{
  "userIds": ["teacher-2", "admin-1"],
  "role": "COLLABORATOR"
}
```

### Adding Students to Group

```json
POST /api/groups/{groupId}/students
{
  "studentIds": ["student-1", "student-2", "student-3"]
}
```

---

## 5. Task Lifecycle

### Task States

```
DRAFT --> PUBLISHED --> ARCHIVED
  |
  └-----> DELETED (only from DRAFT)
```

### State Transitions

1. **DRAFT**
   - Only creator can edit/delete
   - Can add/edit questions
   - Cannot be assigned to students yet
   - Transition: Publish to PUBLISHED

2. **PUBLISHED**
   - Visible to assigned students
   - Cannot be edited
   - Can be assigned to groups/departments
   - Transition: Archive to ARCHIVED

3. **ARCHIVED**
   - Not visible to students for new attempts
   - Previous attempts remain visible
   - Cannot be edited

### Publishing a Task

```json
PATCH /api/tasks/{taskId}/publish
```

---

## 6. API Endpoints Summary

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get accessible tasks
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update draft task
- `DELETE /api/tasks/:id` - Delete draft task
- `PATCH /api/tasks/:id/publish` - Publish task

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get accessible groups
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/members` - Add collaborators
- `DELETE /api/groups/:id/members/:memberId` - Remove member
- `POST /api/groups/:id/students` - Add students

---

## 7. Audit Logging

All actions are logged with:
- User ID
- Action type (TASK_CREATED, GROUP_UPDATED, etc.)
- Entity type and ID
- Changes made
- IP address
- Timestamp

**Logged Actions:**
- USER_CREATED
- ROLE_ASSIGNED / ROLE_REVOKED
- TASK_CREATED / TASK_UPDATED / TASK_PUBLISHED / TASK_DELETED
- GROUP_CREATED / GROUP_UPDATED / GROUP_DELETED
- GROUP_MEMBERS_ADDED / GROUP_MEMBER_REMOVED
- STUDENTS_ADDED_TO_GROUP

---

## 8. Implementation Checklist

### Database
- [x] Schema with Task subtypes
- [x] Visibility Scope enum
- [x] Group model
- [x] AuditLog model
- [ ] Run migration

### Backend
- [x] Task routes with visibility scope
- [x] Group management routes
- [x] RBAC enforcement
- [x] Audit logging
- [ ] Error handling and validation
- [ ] Input sanitization

### Frontend
- [ ] Task creation form with dynamic fields
- [ ] Task subtype selector
- [ ] Visibility scope selector
- [ ] Group/Department selector (filtered by role)
- [ ] Group management UI
- [ ] Task publishing workflow

### Testing
- [ ] RBAC permission tests
- [ ] Visibility scope tests
- [ ] Group membership tests
- [ ] Task creation validation
- [ ] Audit log verification

---

## 9. Common Scenarios

### Scenario 1: Teacher Creates Group Task

1. Teacher creates group "Class A1"
2. Adds students to group
3. Creates READING task with GROUP scope
4. Assigns to "Class A1"
5. Publishes task
6. Students see task in their task list

### Scenario 2: Org Admin Creates Department Task

1. Org Admin selects multiple departments (CSE, ECE)
2. Creates LISTENING task with DEPARTMENT scope
3. Publishes task
4. All students in CSE and ECE see the task
5. Students submit and get evaluated

### Scenario 3: Teachers Collaborate

1. Teacher A creates group "Batch A"
2. Adds Teacher B as COLLABORATOR
3. Both can create tasks for "Batch A"
4. Each task shows who created it
5. Only creator can edit/delete their tasks

---

## 10. Security Considerations

1. **Always verify role** before allowing operations
2. **Check group membership** for GROUP scope tasks
3. **Validate department** for DEPARTMENT scope tasks
4. **Filter results** based on user permissions
5. **Log all modifications** for audit trail
6. **Prevent privilege escalation** by not allowing role changes via non-admin endpoints
7. **Sanitize inputs** for all API endpoints

---

## Error Responses

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | Required fields missing | Input validation failed |
| 403 | Access denied | User lacks permission |
| 404 | Not found | Resource doesn't exist |
| 500 | Failed to create/update | Server error |

---

## Database Schema Relationships

```
User
├── Groups (owned)
├── GroupMemberships
├── Tasks (created)
├── Departments (admin)
└── Attempts

Group
├── Owner (User)
├── Members (GroupMembership)
└── Tasks (TaskGroupAssignment)

Task
├── CreatedBy (User)
├── DepartmentAssignments
├── GroupAssignments
├── Questions
└── Attempts

Department
├── Admin (User)
├── Groups
└── TaskAssignments
```

---

**Last Updated:** June 2026
**Version:** 1.0
