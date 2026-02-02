// Script to try retrieving Firebase Web App config
// Note: Firebase Admin SDK doesn't directly expose Web App config
// This is a helper script to guide you

import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account
const serviceAccountPath = path.resolve(__dirname, "..", "..", "serviceAccountKey.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ serviceAccountKey.json not found");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function getWebAppConfig() {
  try {
    console.log("📋 Project Info:");
    console.log(`   Project ID: ${serviceAccount.project_id}`);
    console.log(`   Project Number: ${serviceAccount.client_id}`);

    console.log("\n⚠️  Firebase Admin SDK cannot retrieve Web App config directly.");
    console.log("   The Web App config (apiKey, messagingSenderId, appId) must be");
    console.log("   obtained from Firebase Console.");

    console.log("\n📝 To get Web App config:");
    console.log("   1. Go to: https://console.firebase.google.com");
    console.log(`   2. Select project: ${serviceAccount.project_id}`);
    console.log("   3. Click ⚙️ Settings → Project Settings");
    console.log("   4. Scroll to 'Your apps' section");
    console.log("   5. Click on Web app (or create one)");
    console.log("   6. Copy the config values");

    console.log("\n💡 The Web App config will look like:");
    console.log("   {");
    console.log('     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",');
    console.log(`     authDomain: "${serviceAccount.project_id}.firebaseapp.com",`);
    console.log(`     projectId: "${serviceAccount.project_id}",`);
    console.log(`     storageBucket: "${serviceAccount.project_id}.appspot.com",`);
    console.log('     messagingSenderId: "123456789012",');
    console.log('     appId: "1:123456789012:web:abcdef1234567890"');
    console.log("   }");

    console.log("\n❌ Cannot auto-retrieve: Firebase Admin SDK doesn't expose Web App API keys.");
    console.log("   This is by design for security reasons.");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

getWebAppConfig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
