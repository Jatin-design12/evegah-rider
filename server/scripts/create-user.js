// Script to create a Firebase user for login
// Usage: node server/scripts/create-user.js <email> <password> [role]
// Example: node server/scripts/create-user.js employee@test.com password123 employee

import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account
const serviceAccountPath = path.resolve(__dirname, "..", "..", "serviceAccountKey.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ serviceAccountKey.json not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function createUser(email, password, role = "employee", displayName = null) {
  try {
    console.log(`\n📧 Creating Firebase user: ${email}`);
    console.log(`   Role: ${role}`);
    if (displayName) console.log(`   Name: ${displayName}`);

    // Create user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || undefined,
      emailVerified: false,
    });

    console.log(`✅ User created successfully!`);
    console.log(`   UID: ${userRecord.uid}`);

    // Set custom claims (role)
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    console.log(`✅ Role '${role}' assigned`);

    console.log(`\n🎉 Login credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log(`\n💡 You can now login at http://localhost:5173/login`);

    return userRecord;
  } catch (error) {
    console.error(`\n❌ Error creating user:`, error.message);
    if (error.code === "auth/email-already-exists") {
      console.log(`\n💡 User already exists. You can login with:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: (use existing password or reset in Firebase Console)`);
    }
    throw error;
  }
}

// Main
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node server/scripts/create-user.js <email> <password> [role] [displayName]");
  console.log("\nExamples:");
  console.log('  node server/scripts/create-user.js employee@test.com password123 employee');
  console.log('  node server/scripts/create-user.js admin@test.com admin123 admin "Admin User"');
  console.log('  node server/scripts/create-user.js adminev@gmail.com admin123 admin');
  process.exit(1);
}

const [email, password, role = "employee", displayName] = args;

createUser(email, password, role, displayName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
