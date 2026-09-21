// Authentication & Role-Based Access Control Helper

/**
 * Handle user login with Firebase Auth and redirect based on role
 * @param {string} email 
 * @param {string} password 
 */
async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error("Please fill in both email and password.");
  }

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email.trim(), password);
    const user = userCredential.user;

    // Fetch user profile from Firestore 'users' collection to determine role
    const userDoc = await db.collection("users").doc(user.uid).get();

    if (!userDoc.exists) {
      // If user doc doesn't exist, sign out and throw error
      await auth.signOut();
      throw new Error("User record not found in database. Contact your administrator.");
    }

    const userData = userDoc.data();
    const role = userData.role;

    // Save session info
    sessionStorage.setItem("userRole", role);
    sessionStorage.setItem("userName", userData.name || user.email);

    // Redirect to corresponding dashboard
    redirectByRole(role);
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
      if (userNameDisplay) userNameDisplay.textContent = userData.name || user.email;
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
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
}
