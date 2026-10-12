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
    let userDoc = await db.collection("users").doc(user.uid).get();

    if (!userDoc.exists) {
      console.log("No document found with Document ID = user.uid. Checking by email:", user.email);
      // Check if user created the document using Auto-ID or their email as the Document ID
      const emailQuery = await db.collection("users").where("email", "==", user.email).get();

      if (!emailQuery.empty) {
        const foundDoc = emailQuery.docs[0];
        const foundData = foundDoc.data();
        console.log("Found existing record under Document ID:", foundDoc.id);

        try {
          // Clone/save under user.uid for direct lookup
          await db.collection("users").doc(user.uid).set({
            ...foundData,
            uid: user.uid
          }, { merge: true });
          userDoc = await db.collection("users").doc(user.uid).get();
        } catch (e) {
          // If write fails, proceed with the found record
          const role = foundData.role || "admin";
          sessionStorage.setItem("userRole", role);
          sessionStorage.setItem("userName", foundData.name || user.email);
          redirectByRole(role);
          return;
        }
      } else {
        // No document exists at all. Attempt auto-provisioning as Admin for the first user
        console.log("Attempting first-time Admin auto-provisioning for UID:", user.uid);
        try {
          const adminProfile = {
            uid: user.uid,
            name: user.email.split("@")[0].toUpperCase(),
            email: user.email,
            role: "admin",
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

    const userData = userDoc.data() || {};
    const role = userData.role || "admin";

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
      if (userNameDisplay) {
        const displayName = userData.name || user.email;
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
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
}
