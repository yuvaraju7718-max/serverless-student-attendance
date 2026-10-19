// Authentication & Role-Based Access Control Helper

/**
 * Handle user profile lookup, role resolution, and dashboard redirection after successful login
 * @param {firebase.User} user
 */
async function handlePostLogin(user) {
  if (!user) throw new Error("No authenticated user found.");

  // Fetch user profile from Firestore 'users' collection to determine role
  let userDoc = await db.collection("users").doc(user.uid).get();

  if (!userDoc.exists) {
    console.log("No document found with Document ID = user.uid. Checking by email:", user.email);

    // 1. Check if user already exists in 'users' collection by email
    const emailQuery = await db.collection("users").where("email", "==", user.email).get();

    if (!emailQuery.empty) {
      const foundDoc = emailQuery.docs[0];
      const foundData = foundDoc.data();
      console.log("Found existing user record under Document ID:", foundDoc.id);

      try {
        await db.collection("users").doc(user.uid).set({
          ...foundData,
          uid: user.uid,
          photoUrl: foundData.photoUrl || user.photoURL || ""
        }, { merge: true });
        userDoc = await db.collection("users").doc(user.uid).get();
      } catch (e) {
        const role = foundData.role || "admin";
        sessionStorage.setItem("userRole", role);
        sessionStorage.setItem("userName", foundData.name || user.displayName || user.email);
        redirectByRole(role);
        return;
      }
    } else {
      // 2. Check if user exists in 'teachers' collection by email
      const teacherQuery = await db.collection("teachers").where("email", "==", user.email).get();
      if (!teacherQuery.empty) {
        const tData = teacherQuery.docs[0].data();
        console.log("Found matching teacher record for:", user.email);
        const tProfile = {
          uid: user.uid,
          name: tData.name || user.displayName || user.email.split("@")[0].toUpperCase(),
          email: user.email,
          role: "teacher",
          department: tData.department || "",
          photoUrl: user.photoURL || tData.photoUrl || "",
          createdAt: new Date().toISOString()
        };
        await db.collection("users").doc(user.uid).set(tProfile);
        userDoc = await db.collection("users").doc(user.uid).get();
      } else {
        // 3. Check if user exists in 'students' collection by email
        const studentQuery = await db.collection("students").where("email", "==", user.email).get();
        if (!studentQuery.empty) {
          const sData = studentQuery.docs[0].data();
          console.log("Found matching student record for:", user.email);
          const sProfile = {
            uid: user.uid,
            name: sData.name || user.displayName || user.email.split("@")[0].toUpperCase(),
            email: user.email,
            role: "student",
            rollNumber: sData.rollNumber || "",
            classId: sData.classId || "",
            semester: sData.semester || "",
            photoUrl: user.photoURL || sData.photoUrl || "",
            createdAt: new Date().toISOString()
          };
          await db.collection("users").doc(user.uid).set(sProfile);
          userDoc = await db.collection("users").doc(user.uid).get();
        } else {
          // 4. Fallback: Auto-provision as Admin for first-time login
          console.log("Attempting first-time Admin auto-provisioning for UID:", user.uid);
          try {
            const adminProfile = {
              uid: user.uid,
              name: (user.displayName || user.email.split("@")[0]).toUpperCase(),
              email: user.email,
              role: "admin",
              photoUrl: user.photoURL || "",
              createdAt: new Date().toISOString()
            };
            await db.collection("users").doc(user.uid).set(adminProfile);
            userDoc = await db.collection("users").doc(user.uid).get();
          } catch (provisionErr) {
            console.warn("Auto-provision failed:", provisionErr);
            await auth.signOut();
            throw new Error(
              `Logged in as ${user.email}, but your profile was not found in Firestore. ` +
              `In Firestore Console > 'users' collection, create a document with Document ID: ${user.uid} and field role: "admin".`
            );
          }
        }
      }
    }
  }

  const userData = (userDoc && userDoc.exists ? userDoc.data() : {}) || {};
  const role = userData.role || "admin";

  // If user signed in with Google and profile has no photoUrl, sync it
  if (user.photoURL && !userData.photoUrl) {
    try {
      await db.collection("users").doc(user.uid).set({ photoUrl: user.photoURL }, { merge: true });
    } catch (ignore) {}
  }

  // Save session info
  sessionStorage.setItem("userRole", role);
  sessionStorage.setItem("userName", userData.name || user.displayName || user.email);

  // Redirect to corresponding dashboard
  redirectByRole(role);
}

/**
 * Handle user login with Email/Password and redirect based on role
 * @param {string} email 
 * @param {string} password 
 */
async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error("Please fill in both email and password.");
  }

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email.trim(), password);
    await handlePostLogin(userCredential.user);
  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
}

/**
 * Handle user login with Google Authentication provider and redirect based on role
 */
async function loginWithGoogle() {
  if (!auth) {
    throw new Error("Firebase Authentication is not available.");
  }

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await auth.signInWithPopup(provider);
    await handlePostLogin(userCredential.user);
  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
}

/**
 * Redirect user to appropriate dashboard based on their role
 * @param {string} role 
 */
function redirectByRole(role) {
  switch (role) {
    case "admin":
      window.location.href = "admin-dashboard.html";
      break;
    case "teacher":
      window.location.href = "teacher-dashboard.html";
      break;
    case "student":
      window.location.href = "student-dashboard.html";
      break;
    default:
      window.location.href = "login.html";
  }
}

/**
 * Log out current user and clear local state
 */
async function logoutUser() {
  try {
    if (auth) {
      await auth.signOut();
    }
    sessionStorage.clear();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout error:", error);
    window.location.href = "login.html";
  }
}

/**
 * Page Guard: Protect pages by enforcing authentication and role permissions
 * @param {string[]} allowedRoles - Array of allowed roles, e.g. ['admin'] or ['teacher', 'admin']
 */
function protectPage(allowedRoles = []) {
  if (!auth) return;

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      // User not logged in, redirect to login page
      sessionStorage.clear();
      window.location.href = "login.html";
      return;
    }

    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists) {
        await logoutUser();
        return;
      }

      const userData = userDoc.data();
      const userRole = userData.role;

      // Update UI elements if present on the page
      const userNameDisplay = document.getElementById("navUserName");
      const userRoleDisplay = document.getElementById("navUserRole");
      if (userNameDisplay) {
        const displayName = (userData.name || user.email).toUpperCase();
        userNameDisplay.style.textTransform = "uppercase";
        if (userData.photoUrl) {
          userNameDisplay.innerHTML = `<img src="${userData.photoUrl}" alt="Avatar" class="avatar-circle avatar-sm" style="margin-right: 0.35rem;" /> ${displayName}`;
        } else {
          userNameDisplay.textContent = displayName;
        }
      }
      if (userRoleDisplay) {
        userRoleDisplay.textContent = userRole;
        userRoleDisplay.className = `role-badge role-${userRole}`;
      }

      // Check role authorization
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        alert("Access Denied: You do not have permission to view this page.");
        redirectByRole(userRole);
      }
    } catch (error) {
      console.error("Error verifying user authorization:", error);
    }
  });
}

/**
 * Translate technical Firebase error codes into friendly user messages
 * @param {Error} error 
 * @returns {string} Friendly error message
 */
function getFriendlyErrorMessage(error) {
  const code = error.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "The email address format is not valid.";
    case "auth/user-disabled":
      return "This user account has been disabled. Please contact the administrator.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/too-many-requests":
      return "Too many unsuccessful attempts. Please wait a few minutes before trying again.";
    case "auth/network-request-failed":
      return "Network connection issue. Please check your internet connection.";
    case "auth/operation-not-allowed":
      return "Google Sign-In is not enabled for this project. Please enable Google provider in Firebase Console > Authentication > Sign-in method.";
    case "auth/popup-closed-by-user":
      return "Google Sign-In popup was closed before completing authentication.";
    case "auth/popup-blocked":
      return "Google Sign-In popup was blocked by your browser. Please allow popups for this site.";
    case "auth/cancelled-popup-request":
      return "Another Google sign-in attempt is already in progress.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Google Sign-In. Add 'localhost' or your hosting domain in Firebase Console > Authentication > Settings > Authorized Domains.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
}
