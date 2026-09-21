# Serverless Cloud-Based Student Attendance Management System

A production-ready, serverless web application designed to eliminate paper registers and manual spreadsheet tracking in academic institutions. Built using Google Firebase serverless cloud infrastructure.

---

## 🎯 Features

- **Role-Based Access Control (RBAC)**: Distinct interfaces and permissions for **Admin**, **Faculty / Teachers**, and **Students**.
- **Deterministic Duplicate Prevention**: Attendance document keys are constructed deterministically (`{studentId}_{subjectId}_{classId}_{date}`) so duplicate marking on the same date updates the record rather than creating redundant entries.
- **Real-Time Attendance Analytics**: Automatically computes total classes conducted, present count, absent count, and percentage per subject and overall.
- **75% Eligibility Thresholds**: Visual progress indicators highlight attendance shortages automatically.
- **Serverless Cloud Architecture**: Zero server management, auto-scaling, high availability, and secure cloud database storage.

---

## 🏗️ Technology Stack

| Layer | Service / Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Modern JavaScript | Responsive user dashboards and forms |
| **Hosting** | Firebase Hosting | Global CDN hosting with free SSL/HTTPS |
| **Authentication** | Firebase Authentication | Secure email & password identity verification |
| **Cloud Database** | Google Cloud Firestore | NoSQL document database storing users, classes, and attendance |
| **Backend Logic** | Firebase Cloud Functions | Event-driven serverless compute |
| **Security** | Firestore Security Rules | Granular role-based database read/write policies |

---

## 📂 Project Directory Structure

```text
├── public/                       # Frontend application (served by Firebase Hosting)
│   ├── css/
│   │   └── style.css             # Unified modern styles
│   ├── js/
│   │   ├── auth.js               # Auth state manager & page route guards
│   │   └── firebase-config.js    # Firebase SDK initialization
│   ├── index.html                # Project landing page
│   ├── login.html                # Role-based login portal
│   ├── admin-dashboard.html      # Admin institute overview & stats
│   ├── teacher-dashboard.html    # Faculty portal & assigned classes
│   ├── student-dashboard.html    # Student attendance analytics & percentages
│   ├── students.html             # Admin: Student management
│   ├── teachers.html             # Admin: Faculty & class/subject allocations
│   ├── classes.html              # Admin: Class & section management
│   ├── subjects.html             # Admin: Course catalog management
│   ├── attendance.html           # Teacher: Class attendance roll-call marking
│   ├── reports.html              # Filterable attendance reports & printable views
│   └── profile.html              # User profile details
│
├── functions/                    # Cloud Functions serverless backend
│
├── firestore.rules               # Role-based Cloud Firestore database security rules
├── firebase.json                 # Firebase Hosting & Firestore deployment configuration
├── DATABASE_DESIGN.md            # Complete database schema and document design
├── PROJECT_REFERENCE.md          # 23-phase project living reference document
└── .gitignore                    # Git ignore rules
```

---

## 🚀 Quick Start & Local Testing

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **Firebase CLI** (`npm install -g firebase-tools`)

### 2. Local Preview
You can test the frontend locally immediately using any static web server:
```bash
npx serve public
```
Or with Firebase CLI:
```bash
firebase serve --only hosting
```
Open [http://localhost:3000](http://localhost:3000) or [http://localhost:5000](http://localhost:5000) in your browser.

### 3. Connecting to your Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project.
3. Enable **Email/Password** sign-in under **Authentication**.
4. Create a **Cloud Firestore** database.
5. Register a Web App in your Firebase project and copy the config credentials.
6. Paste your credentials into [`public/js/firebase-config.js`](public/js/firebase-config.js).

---

## 🛡️ Database Security Rules
To deploy the database security rules:
```bash
firebase deploy --only firestore:rules
```

---

## 🌐 Deploy to Production
Deploy the frontend to Firebase Hosting with a public `.web.app` URL:
```bash
firebase deploy --only hosting
```
