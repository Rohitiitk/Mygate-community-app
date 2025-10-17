import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config({ path: '../backend/.env' });

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  await readFile(new URL('../backend/service-account-key.json', import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();

/**
 * Set custom claims for a user
 * @param {string} email - User email
 * @param {Array} roles - Array of roles ['resident', 'guard', 'admin']
 * @param {string} householdId - Household ID (optional)
 */
async function setCustomClaims(email, roles, householdId = null) {
  try {
    // Get user by email
    const user = await auth.getUserByEmail(email);
    
    const customClaims = {
      roles: roles
    };
    
    if (householdId) {
      customClaims.householdId = householdId;
    }
    
    // Set custom claims
    await auth.setCustomUserClaims(user.uid, customClaims);
    
    console.log(`✅ Custom claims set for ${email}:`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Roles: ${roles.join(', ')}`);
    if (householdId) {
      console.log(`   Household: ${householdId}`);
    }
    
    return user.uid;
  } catch (error) {
    console.error(`❌ Error setting claims for ${email}:`, error.message);
    throw error;
  }
}

/**
 * Main function to set up users with roles
 */
async function setupUsers() {
  console.log('🔧 Setting up user roles...\n');
  
  try {
    // Example: Set up different user roles
    // Replace these with actual user emails from your Firebase Auth
    
    // Admin user
    await setCustomClaims(
      'admin@mygate.com',
      ['admin'],
      null
    );
    
    // Guard user
    await setCustomClaims(
      'guard@mygate.com',
      ['guard'],
      null
    );
    
    // Resident user in household H001
    await setCustomClaims(
      'resident@mygate.com',
      ['resident'],
      'H001'
    );
    
    // Another resident in household H002
    await setCustomClaims(
      'resident2@mygate.com',
      ['resident'],
      'H002'
    );
    
    console.log('\n✅ All user roles configured successfully!');
    console.log('\n⚠️  Note: Users need to sign out and sign in again for claims to take effect.');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupUsers();
}

export { setCustomClaims };