# 🔧 Backend API Testing Complete Guide (বাংলা)

## 📋 Quick Overview

তোমার Multi-Agent Research Backend এর 3টি Main Module আছে:

```
┌─────────────────────────────────────┐
│  BACKEND API MODULES                │
├─────────────────────────────────────┤
│                                     │
│  1. 🔐 AUTH (/api/auth)            │
│     ├─ Register        (POST)       │
│     ├─ Login           (POST)       │
│     ├─ Logout          (POST)       │
│     ├─ Refresh Token   (POST)       │
│     └─ Get Me          (GET)        │
│                                     │
│  2. 🔬 RESEARCH (/api/research)    │
│     ├─ Start Research  (POST)       │
│     ├─ Get Job Status  (GET)        │
│     ├─ Get History     (GET)        │
│     ├─ Health Check    (GET)        │
│     └─ Cache Stats     (GET)        │
│                                     │
│  3. 👤 USERS (/api/users)          │
│     ├─ Get Profile     (GET)        │
│     ├─ Update Profile  (PUT)        │
│     └─ Delete Account  (DELETE)     │
│                                     │
└─────────────────────────────────────┘
```

---

## 🚀 Step 1: Backend Server চালু করা

### A. প্রথমবার Setup

```bash
# Backend folder এ যাও
cd s:\Anthic\ kumar\ singh\MultiAgentResearch\MultiAgentPart-Backend

# Dependencies install করো
npm install

# Server চালু করো
npm run dev
```

**Expected Output:**
```
🛢 Database is connected successfully
Application listening on port 5000
```

### B. Environment Setup (.env file)

Backend folder এ `.env` file তৈরি করো:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/multi-agent-research

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Redis (optional)
REDIS_URL=redis://localhost:6379

# API Configuration
AI_REQUEST_LIMIT=10
AI_REQUEST_WINDOW=3600000
```

---

## 🧪 Step 2: Automated Testing (সহজ উপায়)

### A. একটি Command দিয়ে সব Test করো

Backend server চলতে থাকলে (দ্বিতীয় terminal এ):

```bash
npm run test:backend
# অথবা
npm test
# অথবা
node backend-test.js
```

**Output দেখবা:**
```
======================================================================
🧪 BACKEND API TEST SUITE
======================================================================
Target: http://localhost:5000
Start Time: 5/5/2026, 5:00:00 PM

▶ 1. Health Check
✓ Health check passed (Status: 200)

▶ 2. User Registration
✓ Registration successful (Status: 201)
Email: test_1234567890@example.com

▶ 3. User Login
✓ Login successful (Status: 200)
Token received: eyJhbGciOiJIUzI1NiIs...

▶ 4. Get User Profile
✓ Get profile successful (Status: 200)
User: test_1234567890@example.com

▶ 5. Start Research Job
✓ Research started successfully (Status: 201)
Job ID: 507f1f77bcf86cd799439011
Status: processing

▶ 6. Get Research Job Status
✓ Get job status successful (Status: 200)
Status: processing

▶ 7. Get Research History
✓ Get history successful (Status: 200)
Found 1 research items

▶ 8. Error Handling Tests
✓ Invalid credentials returns 401
✓ Missing auth token returns 401

======================================================================
Test Summary

✓ Health Check
✓ User Registration
✓ User Login
✓ Get Profile
✓ Start Research
✓ Get Job Status
✓ Get History
✓ Error Handling

======================================================================
✓ ALL TESTS PASSED (8/8 - 100%)
End Time: 5/5/2026, 5:00:05 PM
======================================================================
```

---

## 📮 Step 3: Manual Postman Testing (বিস্তারিত পরীক্ষা)

### Installation

1. **Postman Download করো**: https://www.postman.com/downloads/
2. **Install করো এবং খোলো**
3. **নতুন Collection তৈরি করো** (Menu → Collections → +)

---

### Test 1: Health Check ✓

এটি দেখায় Backend সচল আছে কিনা।

```
METHOD: GET
URL: http://localhost:5000/api/research/health

Response (200):
{
  "success": true,
  "message": "Agent is healthy"
}
```

**Postman এ:**
1. নতুন Tab খোলো
2. **GET** select করো
3. URL paste করো: `http://localhost:5000/api/research/health`
4. **Send** ক্লিক করো

✅ Green status (200) পেলে → ঠিক আছে!

---

### Test 2: Register করো ✓

নতুন user তৈরি করো

```
METHOD: POST
URL: http://localhost:5000/api/auth/register

Body (JSON):
{
  "name": "আপনার নাম",
  "email": "আপনার_ইমেইল@example.com",
  "password": "SecurePass123!"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "আপনার নাম",
    "email": "আপনার_ইমেইল@example.com",
    "role": "user"
  }
}
```

**Postman এ:**
1. নতুন Tab খোলো
2. **POST** select করো
3. URL: `http://localhost:5000/api/auth/register`
4. **Body** tab → **raw** → **JSON** select করো
5. JSON paste করো
6. **Send** ক্লিক করো

⚠️ একই email দিয়ে দোবারা register করলে error আসবে। ভিন্ন email দাও।

---

### Test 3: Login করো ✓

Access Token পাওয়ার জন্য

```
METHOD: POST
URL: http://localhost:5000/api/auth/login

Body (JSON):
{
  "email": "আপনার_ইমেইল@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "আপনার_ইমেইল@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Important:** `accessToken` copy করে রাখো!

---

### Test 4: Profile নিজের ✓

Token দিয়ে Profile retrieve করো

```
METHOD: GET
URL: http://localhost:5000/api/auth/me

Headers:
Authorization: Bearer YOUR_ACCESS_TOKEN

Response (200):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "আপনার_ইমেইল@example.com",
    "name": "আপনার নাম"
  }
}
```

**Postman এ:**
1. নতুন Tab খোলো
2. **GET** select করো
3. URL: `http://localhost:5000/api/auth/me`
4. **Headers** tab যাও
5. নতুন header যোগ করো:
   - Key: `Authorization`
   - Value: `Bearer TOKEN_HERE` (এর জায়গায় login থেকে পাওয়া token)
6. **Send** ক্লিক করো

---

### Test 5: Research Start করো ✓

AI Research job শুরু করো

```
METHOD: POST
URL: http://localhost:5000/api/research

Headers:
Authorization: Bearer YOUR_ACCESS_TOKEN

Body (JSON):
{
  "topic": "আপনার গবেষণা বিষয়",
  "maxRetries": 2
}

Response (201):
{
  "success": true,
  "message": "Research job started",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "topic": "আপনার গবেষণা বিষয়",
    "status": "processing",
    "jobId": "unique_job_id_123",
    "createdAt": "2026-05-05T16:00:00.000Z"
  }
}
```

**Important:** `jobId` অথবা `_id` copy করে রাখো!

---

### Test 6: Job Status চেক করো ✓

Research job কত দূর হয়েছে দেখো

```
METHOD: GET
URL: http://localhost:5000/api/research/job/YOUR_JOB_ID

Headers:
Authorization: Bearer YOUR_ACCESS_TOKEN

Response (200):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "status": "completed",
    "result": {
      "report": "Full research report...",
      "critiqueScore": 8.5,
      "factCheckScore": 0.92
    }
  }
}
```

Job Status Possible Values:
- `processing` = কাজ চলছে ⏳
- `completed` = সম্পন্ন ✓
- `failed` = Error হয়েছে ✗

---

### Test 7: Research History দেখো ✓

সব Research history দেখো

```
METHOD: GET
URL: http://localhost:5000/api/research/history

Headers:
Authorization: Bearer YOUR_ACCESS_TOKEN

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "topic": "AI in Healthcare",
      "status": "completed",
      "createdAt": "2026-05-05T16:00:00.000Z"
    },
    ...
  ]
}
```

---

## ✅ Complete Testing Checklist

এই checklist complete করো:

```
[ ] Backend Server চলছে (npm run dev)
    PORT 5000 এ listening করছে

[ ] Health Check Pass
    GET /api/research/health → 200

[ ] User Registration Pass
    POST /api/auth/register → 201
    Valid user created

[ ] User Login Pass
    POST /api/auth/login → 200
    Access token received

[ ] Get Profile Pass
    GET /api/auth/me → 200
    With Authorization header

[ ] Research Start Pass
    POST /api/research → 201
    Job ID received

[ ] Job Status Check Pass
    GET /api/research/job/{jobId} → 200
    Status retrieved

[ ] History Retrieval Pass
    GET /api/research/history → 200
    History array received

[ ] Error Handling Pass
    Invalid credentials → 401
    Missing token → 401
    Invalid JSON → 400

[ ] Database Connected
    MongoDB connected message appears
    Data saving properly

[ ] No Errors in Logs
    Server logs clean
    No warnings
```

---

## 🐛 Troubleshooting

### Problem 1: "Cannot GET /api/research/health"

**কারণ:** Backend server সচল নেই

**সমাধান:**
```bash
npm run dev
# এবং সার্ভার PORT 5000 এ চলছে কিনা দেখো
```

### Problem 2: "401 Unauthorized"

**কারণ:** Authorization token missing অথবা invalid

**সমাধান:**
1. Login করে নতুন token নাও
2. Postman headers এ "Bearer " prefix যোগ করো
3. Token expire হয়নি কিনা চেক করো

### Problem 3: "400 Bad Request"

**কারণ:** Invalid JSON body অথবা missing required fields

**সমাধান:**
1. JSON format চেক করো (valid JSON কিনা)
2. Required fields আছে কিনা দেখো
3. Headers এ `Content-Type: application/json` আছে কিনা

### Problem 4: "ECONNREFUSED"

**কারণ:** Backend server respond করছে না

**সমাধান:**
1. Backend server চালু করো: `npm run dev`
2. MongoDB connected message আছে কিনা দেখো
3. Server logs এ error আছে কিনা চেক করো

### Problem 5: MongoDB Connection Error

**কারণ:** MongoDB running নেই অথবা .env URL ভুল

**সমাধান:**
1. MongoDB চালু করো
2. `.env` এর DATABASE_URL সঠিক আছে কিনা চেক করো
3. Server restart করো

---

## 📊 API Response Times (Expected)

| Endpoint | Expected Time |
|----------|----------------|
| Health Check | < 50ms |
| Register | 100-300ms |
| Login | 100-300ms |
| Get Me | < 100ms |
| Start Research | 200-500ms |
| Get Job Status | 100-300ms |
| Get History | 200-500ms |

---

## 💾 Data Verification

MongoDB এ সরাসরি data check করতে:

```bash
# MongoDB CLI এ:
use multi-agent-research

# Users দেখো:
db.users.find()

# Research jobs দেখো:
db.researches.find()

# Count করো:
db.users.countDocuments()
db.researches.countDocuments()
```

---

## 🔐 Security Checks

```
✓ Password hashing working?
  ✅ Password plaintext এ save হয় না
  
✓ Token validation working?
  ✅ Invalid token দিলে error আসে
  
✓ CORS properly configured?
  ✅ Frontend cross-origin access করতে পারে
  
✓ Rate limiting working?
  ✅ অনেক requests blocking হয়
```

---

## 🎯 Complete Testing Flow

এই order এ test করো:

```
1. npm run dev
   ↓
2. Health Check
   ↓
3. Register
   ↓
4. Login
   ↓
5. Get Profile
   ↓
6. Start Research
   ↓
7. Check Job Status
   ↓
8. Get History
   ↓
✅ All Pass!
```

---

## 📝 Postman Collection Export/Import

### Export করতে (teammates এর জন্য):
1. Collection এ right-click করো
2. **Export** select করো
3. Format: **Collection v2.1**
4. Save করো

### Import করতে:
1. **Import** button click করো
2. Export করা file select করো
3. **Import** click করো

---

## 🔗 Useful Links

- [Postman Documentation](https://learning.postman.com/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [REST API Best Practices](https://restfulapi.net/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)

---

## 📞 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 5000 already in use | Kill process: `lsof -ti:5000 \| xargs kill -9` |
| MongoDB not connected | Check `.env` DATABASE_URL |
| Token expired | Login again and get new token |
| CORS error | Check `.env` CORS_ORIGIN |
| Database error | Ensure MongoDB is running |

---

## ✨ Success Indicators

সব কিছু ঠিক আছে যদি:

- ✅ Health check 200 return করে
- ✅ Register এবং Login কাজ করে
- ✅ Profile retrieve করতে পারো
- ✅ Research job start করতে পারো
- ✅ Job status check করতে পারো
- ✅ History দেখতে পারো
- ✅ Invalid requests proper errors return করে
- ✅ Database তে data save হয়

---

**এখনই শুরু করো! Happy Testing! 🚀**

Terminal খোলো এবং চালাও:
```bash
npm run test:backend
```

অথবা Postman খোলো এবং manual testing শুরু করো!
