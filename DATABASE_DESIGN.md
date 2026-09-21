# Database Design - Serverless Attendance System
## Cloud Firestore Schema Specification (Phase 4)

This document specifies the exact structure of all collections, documents, data types, and relationships used in Cloud Firestore.

---

## 1. Design Strategy: IDs vs. Complex References
- In this project, we store **simple string IDs** (such as `studentId`, `classId`, `subjectId`, `teacherId`) rather than nested object references or Firestore DocumentReference types.
- **Why?** It simplifies frontend querying, keeps documents decoupled, and makes data indexing and duplicate checking straightforward.

---

## 2. Collections Overview

| Collection Name | Document ID Pattern | Purpose |
|---|---|---|
| `users` | Auth `uid` | User profile, role mapping (`admin`, `teacher`, `student`) |
| `students` | Auto ID or `uid` | Student records (Roll No, Class ID, Name, Email) |
| `teachers` | Auto ID or `uid` | Teacher profiles (Name, Email, Department) |
| `classes` | Auto ID (e.g., `CSE-A`) | Class/Section info (Name, Semester, Dept) |
| `subjects` | Auto ID (e.g., `CS301`) | Course info (Subject Code, Name, Dept) |
| `assignments` | Auto ID | Maps Teacher <-> Class <-> Subject |
| `attendance` | `{studentId}_{subjectId}_{classId}_{date}` | Individual student attendance entries |

---

## 3. Collection Specifications

### 3.1 `users`
- **Document ID**: Firebase Auth `uid`
```json
{
  "uid": "USER_AUTH_UID_123",
  "name": "Prof. Alan Turing",
  "email": "alan@college.edu",
  "role": "teacher",       // "admin" | "teacher" | "student"
  "createdAt": "2026-09-21T10:00:00.000Z",
  "updatedAt": "2026-09-21T10:00:00.000Z"
}
```

### 3.2 `teachers`
- **Document ID**: Teacher `uid` or auto ID
```json
{
  "id": "TEACHER_123",
  "uid": "USER_AUTH_UID_123",
  "name": "Prof. Alan Turing",
  "email": "alan@college.edu",
  "department": "Computer Science & Engineering",
  "phone": "9876543210",
  "createdAt": "2026-09-21T10:00:00.000Z"
}
```

### 3.3 `classes`
- **Document ID**: Class ID (e.g., `class_cse_3a`)
```json
{
  "id": "class_cse_3a",
  "name": "CSE - 3rd Year Section A",
  "department": "CSE",
  "semester": 5,
  "academicYear": "2026-2027",
  "createdAt": "2026-09-21T10:00:00.000Z"
}
```

### 3.4 `subjects`
- **Document ID**: Subject Code or auto ID (e.g., `sub_cs501`)
```json
{
  "id": "sub_cs501",
  "code": "CS501",
  "name": "Cloud Computing & Serverless Architectures",
  "department": "CSE",
  "createdAt": "2026-09-21T10:00:00.000Z"
}
```

### 3.5 `students`
- **Document ID**: Student `uid` or auto ID
```json
{
  "id": "stu_2026_001",
  "uid": "AUTH_UID_IF_ACCOUNT_CREATED",
  "rollNumber": "2026CSE001",
  "name": "Alice Johnson",
  "email": "alice@student.college.edu",
  "classId": "class_cse_3a",
  "department": "CSE",
  "createdAt": "2026-09-21T10:00:00.000Z"
}
```

### 3.6 `assignments` (Teacher-Class-Subject mapping)
- **Document ID**: Auto ID or `{teacherId}_{classId}_{subjectId}`
```json
{
  "id": "asgn_123",
  "teacherId": "TEACHER_123",
  "teacherName": "Prof. Alan Turing",
  "classId": "class_cse_3a",
  "className": "CSE - 3rd Year Section A",
  "subjectId": "sub_cs501",
  "subjectName": "Cloud Computing & Serverless Architectures",
  "createdAt": "2026-09-21T10:00:00.000Z"
}
```

### 3.7 `attendance` (Duplicate Prevention Mechanism)
- **Document ID Rule**:  
  `{studentId}_{subjectId}_{classId}_{date}` (e.g., `stu_2026_001_sub_cs501_class_cse_3a_2026-09-21`)
  
  *By assigning this deterministic ID, if a teacher accidentally marks attendance twice on the same day for the same subject/class/student, it overwrites/updates rather than creating a duplicate row!*

```json
{
  "id": "stu_2026_001_sub_cs501_class_cse_3a_2026-09-21",
  "studentId": "stu_2026_001",
  "studentName": "Alice Johnson",
  "rollNumber": "2026CSE001",
  "classId": "class_cse_3a",
  "subjectId": "sub_cs501",
  "teacherId": "TEACHER_123",
  "date": "2026-09-21",
  "status": "Present",          // "Present" | "Absent"
  "createdAt": "2026-09-21T10:30:00.000Z",
  "updatedAt": "2026-09-21T10:30:00.000Z"
}
```

---

## 4. Attendance Percentage Formula
$$\text{Attendance \%} = \left(\frac{\text{Total Classes Attended (Present)}}{\text{Total Classes Conducted}}\right) \times 100$$
Calculated both **Subject-wise** and **Overall**.
