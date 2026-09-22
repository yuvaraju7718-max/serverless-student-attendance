# Serverless Cloud-Based Student Attendance Management System
## Project Reference Document (Living Document)

Use this document whenever you need to check something about the project. It covers everything decided so far (Phases 1 and 2) and the plan for the rest. Sections marked **[Planned]** are drafts that get finalized in the phase named next to them.

---

## 0. Progress Tracker

| Phase | Topic | Status |
|---|---|---|
| 1 | Project planning | Done |
| 2 | Requirements | Done |
| 3 | Architecture | Done |
| 4 | Database design | Done (Documented in DATABASE_DESIGN.md) |
| 5 | Install software | Done (Node.js v24 LTS + Firebase CLI installed) |
| 6 | Create Firebase project | Done (Connected to student-attendance-syste-17716) |
| 7 | Create project folder | Done (Verified & configured) |
| 8 | Create frontend | Done (10 HTML pages, modular CSS, Auth & Config JS) |
| 9 | Connect Firebase | Done (Config linked in public/js/firebase-config.js) |
| 10 | Authentication | Done (Admin login verified) |
| 11 | Admin module | Done (Classes, Subjects, Teachers, Students verified) |
| 12 | Teacher module | Done (Attendance roll-call & submissions verified) |
| 13 | Student module | Done (Student card & percentages verified) |
| 14 | Attendance module | Done (Duplicate prevention tested & working) |
| 15 | Attendance calculation | Done (Subject-wise & overall percentage calculation working) |
| 16 | Cloud Functions | Skipped (Free-tier safe: Hosting + Auth + Firestore only) |
| 17 | Security rules | Done (Deployed to Google Cloud Firestore) |
| 18 | Testing | In Progress |
| 19 | Deployment | Done (Live at https://student-attendance-syste-17716.web.app) |
| 20 | GitHub | In Progress |
| 21 | Documentation | Done (README.md & Architecture documented) |
| 22 | PPT | Pending |
| 23 | Viva preparation | Pending |

> **Working Rule**: We move to the next phase only when you say **NEXT**.

---

## 1. Project Overview
- **Title**: Serverless Cloud-Based Student Attendance Management System
- **Repository / Folder Name**: `serverless-student-attendance` (or current project folder)

### Problem Statement
Many colleges still take attendance on paper registers or scattered Excel sheets. This wastes time, causes errors and duplicate entries, gives students no early view of their attendance percentage, makes subject-wise reports slow to prepare, offers weak security, and (for traditional online systems) needs a server that someone must buy, configure, secure, and maintain.

This project builds a secure web application on serverless cloud services so teachers can mark attendance online, students can see their percentages instantly, and admins can manage everything in one place, without running any server ourselves.

### Objectives
1. Build a web-based attendance system with three roles: Admin, Teacher, Student.
2. Use Firebase Authentication for login and role-based access for authorization.
3. Store all data in Cloud Firestore.
4. Run important backend logic (attendance validation and submission) in Firebase Cloud Functions.
5. Prevent duplicate attendance for the same student + subject + class + date.
6. Calculate attendance percentage automatically (per subject and overall).
7. Protect data with Firestore Security Rules.
8. Deploy on Firebase Hosting with a public URL.
9. Learn and clearly demonstrate how serverless cloud architecture works.

### Scope
- **In scope**: Login/logout; admin management of students, teachers, subjects, classes, and assignments; teacher attendance marking, history, and reports; student dashboard; Cloud Functions; security rules; testing; deployment; GitHub; report; PPT; viva preparation.
- **Out of scope**: Mobile app, biometric/face/QR attendance, SMS/email notifications, payments, React/Angular/Vue, TypeScript, MongoDB, MySQL, Docker.
- **Optional later**: Firebase Storage for profile pictures or documents.

---

## 2. User Roles and Permissions
- **Authentication** = "Who are you?" (email + password login)
- **Authorization** = "What are you allowed to do?" (depends on role)

| Role | Access | Example |
|---|---|---|
| **admin** | Full management access | Adds a student, assigns a teacher |
| **teacher** | Attendance only for assigned classes/subjects | Cannot mark a class they do not teach |
| **student** | Read-only, own data only | Can view own attendance, never edit it |

### Hard Rules
- Students can never modify attendance.
- Teachers cannot modify another teacher's assignments unless explicitly authorized.
- There is no public sign-up. The admin creates all users, so nobody can register themselves as a teacher or student.

---

## 3. Features by Role
- **Admin**: Login; add/edit/delete/view students; add/edit/delete/view teachers; add subjects; manage classes; assign teachers to subjects/classes; view attendance and reports; dashboard (total students, teachers, subjects, classes, attendance summary).
- **Teacher**: Login; view assigned classes and subjects; select class, subject, date; view student list; mark Present/Absent; submit attendance; view history; view reports.
- **Student**: Login; view profile (name, roll number, class); view enrolled subjects; view attendance history; view subject-wise percentage (Subject | Total | Present | Absent | Percentage); view overall percentage.

---

## 4. Technology Stack

| Layer | Technology | Role in the Project |
|---|---|---|
| **Frontend** | HTML, CSS, JavaScript (Bootstrap optional) | Pages users see |
| **Authentication** | Firebase Authentication | Secure login |
| **Database** | Cloud Firestore | Stores all data |
| **Backend logic** | Firebase Cloud Functions | Cloud code that runs on demand |
| **Hosting** | Firebase Hosting | Serves the website |
| **Tools** | Visual Studio Code, Node.js, Firebase CLI | Writing and deploying |
| **Version control** | Git + GitHub | History and sharing |

### What "Serverless" Means
It does not mean there are no servers. Servers exist in Google's data centers. Serverless means you do not set up, manage, patch, or scale them; the cloud provider does. You write and deploy application logic only.
- *Analogy*: Your own server is like owning a car (buy, fuel, service). Serverless is like a taxi app (say where you want to go, pay for the ride).

---

## 5. Architecture

### Serverless Architecture Flow
```
User (Admin / Teacher / Student)
 │
 ▼
Web Browser
 │
 ▼
Firebase Hosting  <-- serves the website files
 │
 ▼
HTML / CSS / JavaScript Frontend
 │
 ├──> Firebase Authentication  <-- checks who you are (login)
 │
 ├──> Cloud Functions          <-- backend logic (attendance validation & submission)
 │         │
 │         ▼
 └──> Cloud Firestore          <-- stores all data (direct read for dashboard/profile protected by Security Rules)
```

### Traditional Architecture (for Viva Comparison)
`Browser -> Backend Server (buy, install, secure, maintain) -> Database`

### Where Does Each Component Live?
- **Backend logic**: Firebase Cloud Functions
- **Database**: Cloud Firestore
- **Website hosting**: Firebase Hosting
- **Login / Auth**: Firebase Authentication

### When to Use Cloud Functions vs Direct Firestore Access
- **Cloud Function**: Operations needing trusted server-side checks, such as submitting attendance (verifies: Is this teacher assigned? Is it a duplicate? Is data valid?).
- **Direct Firestore Read (protected by Security Rules)**: Simple reads, such as a student viewing their own attendance record or profile.
- We deliberately do not put every operation into a Cloud Function to optimize performance and simplicity.

---

## 6. Requirements Summary
- **Functional Requirements (FR-01 to FR-28)**: Covers authentication, role redirection, student/teacher/class/subject management, attendance marking, duplicate prevention, attendance calculation, reports, Cloud Functions validation, and security rules.
- **Non-Functional Requirements**: Security, scalability, availability, usability, performance, reliability, maintainability, and modern browser compatibility.

---

## 7. Folder Structure [Draft: to be verified in Phase 7]

```text
serverless-student-attendance/
│
├── public/                       # Everything Firebase Hosting serves
│   ├── index.html                # Landing page
│   ├── login.html                # Login page
│   ├── admin-dashboard.html      # Admin dashboard
│   ├── teacher-dashboard.html    # Teacher dashboard
│   ├── student-dashboard.html    # Student dashboard
│   ├── students.html             # Manage students
│   ├── teachers.html             # Manage teachers
│   ├── subjects.html             # Manage subjects
│   ├── classes.html              # Manage classes
│   ├── attendance.html           # Mark & view attendance
│   ├── reports.html              # Attendance reports
│   ├── profile.html              # User profile
│   ├── css/                      # Shared stylesheets
│   └── js/                       # Shared JavaScript (firebase config, auth, helpers)
│
├── functions/                    # Cloud Functions backend code (Node.js)
│   ├── index.js
│   └── package.json
│
├── firestore.rules               # Firestore Security Rules
├── firebase.json                 # Firebase project configuration
├── .gitignore                    # Files Git must ignore (node_modules, keys, etc.)
└── README.md                     # Project description
```

---

## 8. Working Rules
1. Step-by-step, one phase at a time; wait for **NEXT**.
2. Simple language; technical terms explained before use.
3. For every code file: exact filename, location, complete code, how to run, how to test, common errors.
4. If an error occurs: explain what it means, why it happened, which file caused it, how to fix it.
5. Never share passwords, private keys, or credentials.
