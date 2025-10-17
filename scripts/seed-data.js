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

const db = admin.firestore();
const auth = admin.auth();

/**
 * Create a user with email/password
 */
async function createUser(email, password, displayName) {
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true
    });
    console.log(`✅ Created user: ${email} (${userRecord.uid})`);
    return userRecord.uid;
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      const existingUser = await auth.getUserByEmail(email);
      console.log(`ℹ️  User already exists: ${email} (${existingUser.uid})`);
      return existingUser.uid;
    }
    throw error;
  }
}

/**
 * Seed the database
 */
async function seedDatabase() {
  console.log('🌱 Seeding database...\n');

  try {
    // 1. Create households
    console.log('📦 Creating households...');
    
    const household1Ref = db.collection('households').doc('H001');
    await household1Ref.set({
      flatNo: 'A-101',
      name: 'Sharma Residence',
      members: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('  ✅ Created household H001 (A-101)');

    const household2Ref = db.collection('households').doc('H002');
    await household2Ref.set({
      flatNo: 'B-205',
      name: 'Patel Residence',
      members: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('  ✅ Created household H002 (B-205)');

    // 2. Create users
    console.log('\n👤 Creating users...');
    
    // Admin
    const adminUid = await createUser(
      'admin@mygate.com',
      'Admin@123',
      'Admin User'
    );
    
    await auth.setCustomUserClaims(adminUid, {
      roles: ['admin']
    });
    
    await db.collection('users').doc(adminUid).set({
      displayName: 'Admin User',
      email: 'admin@mygate.com',
      roles: ['admin'],
      householdId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Guard
    const guardUid = await createUser(
      'guard@mygate.com',
      'Guard@123',
      'Security Guard'
    );
    
    await auth.setCustomUserClaims(guardUid, {
      roles: ['guard']
    });
    
    await db.collection('users').doc(guardUid).set({
      displayName: 'Security Guard',
      email: 'guard@mygate.com',
      roles: ['guard'],
      householdId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Resident 1 (Household H001)
    const resident1Uid = await createUser(
      'resident@mygate.com',
      'Resident@123',
      'Rajesh Sharma'
    );
    
    await auth.setCustomUserClaims(resident1Uid, {
      roles: ['resident'],
      householdId: 'H001'
    });
    
    await db.collection('users').doc(resident1Uid).set({
      displayName: 'Rajesh Sharma',
      email: 'resident@mygate.com',
      roles: ['resident'],
      householdId: 'H001',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update household members
    await household1Ref.update({
      members: admin.firestore.FieldValue.arrayUnion(resident1Uid)
    });

    // Resident 2 (Household H002)
    const resident2Uid = await createUser(
      'resident2@mygate.com',
      'Resident@123',
      'Priya Patel'
    );
    
    await auth.setCustomUserClaims(resident2Uid, {
      roles: ['resident'],
      householdId: 'H002'
    });
    
    await db.collection('users').doc(resident2Uid).set({
      displayName: 'Priya Patel',
      email: 'resident2@mygate.com',
      roles: ['resident'],
      householdId: 'H002',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await household2Ref.update({
      members: admin.firestore.FieldValue.arrayUnion(resident2Uid)
    });

    // 3. Create sample visitors
    console.log('\n🚶 Creating sample visitors...');
    
    // Pending visitor for H001
    const visitor1Ref = await db.collection('visitors').add({
      name: 'Ramesh Kumar',
      phone: '+91-9876543210',
      purpose: 'Personal Visit',
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      hostHouseholdId: 'H001',
      createdBy: resident1Uid,
      status: 'pending',
      approvedBy: null,
      approvedAt: null,
      checkedInAt: null,
      checkedOutAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`  ✅ Created pending visitor: Ramesh Kumar (${visitor1Ref.id})`);

    // Approved visitor for H002
    const visitor2Ref = await db.collection('visitors').add({
      name: 'Anjali Verma',
      phone: '+91-9876543211',
      purpose: 'Delivery',
      scheduledTime: new Date().toISOString(),
      hostHouseholdId: 'H002',
      createdBy: resident2Uid,
      status: 'approved',
      approvedBy: resident2Uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      checkedInAt: null,
      checkedOutAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`  ✅ Created approved visitor: Anjali Verma (${visitor2Ref.id})`);

    // Checked-in visitor for H001
    const visitor3Ref = await db.collection('visitors').add({
      name: 'Suresh Reddy',
      phone: '+91-9876543212',
      purpose: 'Plumber',
      scheduledTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      hostHouseholdId: 'H001',
      createdBy: resident1Uid,
      status: 'checked_in',
      approvedBy: resident1Uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      checkedInBy: guardUid,
      checkedInAt: admin.firestore.FieldValue.serverTimestamp(),
      checkedOutAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`  ✅ Created checked-in visitor: Suresh Reddy (${visitor3Ref.id})`);

    // 4. Create sample audit events
    console.log('\n📝 Creating sample audit events...');
    
    await db.collection('events').add({
      type: 'visitor_created',
      actorUserId: resident1Uid,
      subjectId: visitor1Ref.id,
      payload: { visitorName: 'Ramesh Kumar', purpose: 'Personal Visit' },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    await db.collection('events').add({
      type: 'visitor_approved',
      actorUserId: resident2Uid,
      subjectId: visitor2Ref.id,
      payload: { visitorName: 'Anjali Verma' },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    await db.collection('events').add({
      type: 'visitor_checked_in',
      actorUserId: guardUid,
      subjectId: visitor3Ref.id,
      payload: { visitorName: 'Suresh Reddy' },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    console.log('  ✅ Created audit events');

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('  • 2 Households created');
    console.log('  • 4 Users created (1 admin, 1 guard, 2 residents)');
    console.log('  • 3 Visitors created (1 pending, 1 approved, 1 checked-in)');
    console.log('  • 3 Audit events logged');
    
    console.log('\n🔑 Test Credentials:');
    console.log('  Admin:');
    console.log('    Email: admin@mygate.com');
    console.log('    Password: Admin@123');
    console.log('  Guard:');
    console.log('    Email: guard@mygate.com');
    console.log('    Password: Guard@123');
    console.log('  Resident 1 (A-101):');
    console.log('    Email: resident@mygate.com');
    console.log('    Password: Resident@123');
    console.log('  Resident 2 (B-205):');
    console.log('    Email: resident2@mygate.com');
    console.log('    Password: Resident@123');

    console.log('\n⚠️  Important: Users must sign in to activate custom claims!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();