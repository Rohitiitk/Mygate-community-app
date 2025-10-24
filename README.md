# 🏘️ MyGate Community Management System

A full-stack community management application where residents pre-authorize visitors, guards check them in/out, and admins oversee operations. Features secure RBAC authentication, real-time push notifications, and an AI Copilot powered by OpenAI.

## 🎥 Demo

**Live URL:** [not live yet]

**Health Endpoint:** `https://your-api-url.run.app/health`

**Demo:** 'https://drive.google.com/file/d/15SO8cO9fsJGlxkIAuswEfpnpOikULQYi/view?usp=sharing'

## 📐 90-Second Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React PWA)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐│
│  │ Resident │  │  Guard   │  │  Admin   │  │ AI Copilot  ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘│
└────────────────────────┬────────────────────────────────────┘
                         │ Firebase Auth (ID Tokens + Custom Claims)
                         │
┌────────────────────────▼────────────────────────────────────┐
│              BACKEND API (Cloud Run / Node.js)              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐│
│  │ Auth         │  │ Visitors     │  │ AI Chat           ││
│  │ Middleware   │  │ Management   │  │ (llama3.2:3b)   ││
│  └──────────────┘  └──────────────┘  └───────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     FIRESTORE                                │
│  ┌───────────┐  ┌───────────┐  ┌────────────┐  ┌─────────┐│
│  │  users    │  │households │  │  visitors  │  │ events  ││
│  │  (roles)  │  │ (members) │  │  (status)  │  │ (audit) ││
│  └───────────┘  └───────────┘  └────────────┘  └─────────┘│
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│            FCM (Firebase Cloud Messaging)                    │
│         Push notifications to devices & topics               │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User authenticates → Firebase Auth issues ID token with custom claims (roles, householdId)
2. Client sends requests → Backend validates token → Checks RBAC
3. AI Copilot request → OpenAI function calling → Backend validates & executes → Writes to Firestore
4. Every action → Append-only audit event created → FCM notification sent
5. Firestore Security Rules enforce RBAC on client-side reads/writes

## 🔐 RBAC Policy (Who Can Do What)

| Action | Resident | Guard | Admin |
|--------|----------|-------|-------|
| Create visitor for own household | ✅ | ❌ | ✅ |
| Approve/Deny visitor for own household | ✅ | ❌ | ✅ |
| Check in approved visitor | ❌ | ✅ | ✅ |
| Check out checked-in visitor | ❌ | ✅ | ✅ |
| View own household visitors | ✅ | ❌ | ✅ |
| View all visitors | ❌ | ✅ | ✅ |
| View audit log (own actions) | ✅ | ❌ | ❌ |
| View full audit log | ❌ | ✅ | ✅ |
| Use AI Copilot | ✅ | ✅ | ✅ |
| Manage users & households | ❌ | ❌ | ✅ |

**Implementation:**
- Custom claims set via Firebase Admin SDK
- Backend middleware validates roles on every request
- Firestore Security Rules enforce permissions on direct database access
- AI Copilot validates user role before executing tool actions

## 🤖 AI Tools

The AI Copilot uses OpenAI GPT-4o-mini with function calling and structured outputs:

| Tool Name | Parameters | Required Role | Description |
|-----------|------------|---------------|-------------|
| `approve_visitor` | `visitorId: string`<br>`visitorName?: string` | Resident/Admin | Approve a pending visitor |
| `deny_visitor` | `visitorId: string`<br>`visitorName?: string`<br>`reason?: string` | Resident/Admin | Deny a pending visitor |
| `checkin_visitor` | `visitorId: string`<br>`visitorName?: string` | Guard/Admin | Check in an approved visitor |
| `checkout_visitor` | `visitorId: string`<br>`visitorName?: string` | Guard/Admin | Check out a checked-in visitor |
| `list_visitors` | `status?: enum` | All | List visitors with optional status filter |

**Example Prompts:**
- "Approve Ramesh"
- "Deny visitor with phone +91-9876543210 because they're not expected"
- "Check in Mr. Verma"
- "Show me all pending visitors"

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- Firebase project
- Google Cloud project (auto-created with Firebase)
- ollama

### 1. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Create project at https://console.firebase.google.com
# Enable Authentication (Email/Password & Phone)
# Create Firestore database
# Enable Cloud Messaging
```

### 2. Clone & Install

```bash
git clone <https://github.com/Rohitiitk/Mygate-community-app>
cd mygate-community-app

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..

# Scripts
cd scripts
npm install
cd ..
```

### 3. Environment Variables

**Backend `.env`:**
```env
PORT=8080
GOOGLE_CLOUD_PROJECT=your-project-id
OPENAI_API_KEY=sk-...
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account-key.json
```

**Frontend `.env`:**
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_
