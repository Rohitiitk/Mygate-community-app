// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import admin from 'firebase-admin';
// import { readFile } from 'fs/promises';
// import { fileURLToPath } from 'url';
// import { dirname, join } from 'path';

// // Get current directory for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // Load environment variables
// dotenv.config({ path: join(__dirname, '../.env') });

// // Initialize Firebase Admin
// const serviceAccountPath = join(__dirname, '../service-account-key.json');
// let serviceAccount;

// try {
//   serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));
// } catch (error) {
//   console.error('❌ Error reading service account key:', error.message);
//   console.error('Make sure service-account-key.json is in the backend/ folder');
//   process.exit(1);
// }

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   projectId: process.env.GOOGLE_CLOUD_PROJECT
// });

// const db = admin.firestore();
// const auth = admin.auth();

// // Add this import with other route imports
// const notificationsModule = await import('./routes/notifications.js');
// const notificationsRouter = notificationsModule.default;

// // Add this route with other routes
// app.use('/api/notifications', notificationsRouter);

// // Make available globally
// global.db = db;
// global.auth = auth;
// global.admin = admin;

// console.log('✅ Firebase Admin initialized');

// const app = express();
// const PORT = process.env.PORT || 8080;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Request logging
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.path}`);
//   next();
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({ 
//     status: 'healthy', 
//     timestamp: new Date().toISOString(),
//     service: 'mygate-api',
//     version: '1.0.0'
//   });
// });

// // Import routes (dynamic imports for ES modules)
// const visitorsModule = await import('./routes/visitors.js');
// const chatModule = await import('./routes/chat.js');
// const auditModule = await import('./routes/audit.js');

// const visitorsRouter = visitorsModule.default;
// const chatRouter = chatModule.default;
// const auditRouter = auditModule.default;

// // Use routes
// app.use('/api/visitors', visitorsRouter);
// app.use('/api/chat', chatRouter);
// app.use('/api/audit', auditRouter);

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('❌ Error:', err);
//   res.status(err.status || 500).json({
//     error: err.message || 'Internal server error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });

// app.listen(PORT, () => {
//   console.log('='.repeat(50));
//   console.log(`🚀 MyGate API server running on port ${PORT}`);
//   console.log(`📍 Health check: http://localhost:${PORT}/health`);
//   console.log(`🔥 Firebase project: ${process.env.GOOGLE_CLOUD_PROJECT}`);
//   console.log('='.repeat(50));
// });

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const broadcastModule = await import('./routes/broadcast.js');
const analyticsModule = await import('./routes/analytics.js');
const broadcastRouter = broadcastModule.default;
const analyticsRouter = analyticsModule.default;

// --- Setup Directory ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Load Environment Variables ---
dotenv.config({ path: join(__dirname, '../.env') });

// --- Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 8080;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Add routes
app.use('/api/broadcast', broadcastRouter);
app.use('/api/analytics', analyticsRouter);

// --- Request Logging ---
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// --- Firebase Admin Initialization ---
const serviceAccountPath = join(__dirname, '../service-account-key.json');
let serviceAccount;

try {
  serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('❌ Error reading service account key:', error.message);
  console.error('Make sure service-account-key.json is in the backend/ folder');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

const db = admin.firestore();
const auth = admin.auth();

// Make available globally (optional)
global.db = db;
global.auth = auth;
global.admin = admin;

console.log('✅ Firebase Admin initialized');

// --- Health Check Endpoint ---
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mygate-api',
    version: '1.0.0'
  });
});

// --- Import Routes Dynamically ---
const visitorsModule = await import('./routes/visitors.js');
const chatModule = await import('./routes/chat.js');
const auditModule = await import('./routes/audit.js');
const notificationsModule = await import('./routes/notifications.js');

const visitorsRouter = visitorsModule.default;
const chatRouter = chatModule.default;
const auditRouter = auditModule.default;
const notificationsRouter = notificationsModule.default;

// --- Use Routes ---
app.use('/api/visitors', visitorsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/audit', auditRouter);
app.use('/api/notifications', notificationsRouter);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 MyGate API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔥 Firebase project: ${process.env.GOOGLE_CLOUD_PROJECT}`);
  console.log('='.repeat(50));
});
