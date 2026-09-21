// Firebase Configuration
// Connected to Firebase Project: student-attendance-syste-17716

const firebaseConfig = {
  apiKey: "AIzaSyDLk-KdZI47_MWdVXcZuTft-u5HC5GNt9E",
  authDomain: "student-attendance-syste-17716.firebaseapp.com",
  projectId: "student-attendance-syste-17716",
  storageBucket: "student-attendance-syste-17716.firebasestorage.app",
  messagingSenderId: "606111647215",
  appId: "1:606111647215:web:984c7c3ce292549d86221a",
  measurementId: "G-QB12L544K6"
};

// Initialize Firebase
let auth, db;

try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("Firebase initialized successfully with project:", firebaseConfig.projectId);
  } else {
    console.error("Firebase SDK script not loaded in this document.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}
