# 🚀 Backend API Testing Guide - Postman + Manual Verification

## Backend Structure

তোমার Backend এর 3টি Module আছে:
```
✓ /auth      → User registration, login, token refresh
✓ /research  → Research operations (AI job management)
✓ /users     → User profile management
```

---

## 📋 Step 1: Backend Server চালু করা

### Option A: npm দিয়ে চালু করা
```bash
cd s:\Anthic\ kumar\ singh\MultiAgentResearch\MultiAgentPart-Backend
npm install
npm run dev
```

**Expected Output:**
```
🛢 Database is connected successfully
Application listening on port 5000
```

### Option B: পোর্ট পরিবর্তন করা
`.env` ফাইলে:
```
PORT=5000
DATABASE_URL=mongodb://localhost:27017/multi-agent-research
```

---

## 🔑 Step 2: Postman Setup

### 2.1 Postman Download & Install
- Download: https://www.postman.com/downloads/
- Install করো
- Account বানাও (optional but recommended)

### 2.2 নতুন Collection তৈরি করো
1. Postman খোলো
2. **Collections** → **+ New Collection**
3. নাম দাও: `Multi-Agent Research API`
4. Description: `Backend API Testing`

---

## 🧪 Step 3: API Endpoints Test করো

### **A. HEALTH CHECK (Server চলছে কিনা)**

```
METHOD: GET
URL: http://localhost:5000/api/research/health

Expected Response (200):
{
  "success": true,
  "message": "Agent is healthy"
}
```

**Postman এ Setup:**
1. নতুন Tab খোলো
2. **GET** সিলেক্ট করো
3. URL এ পেস্ট করো: `http://localhost:5000/api/research/health`
4. **Send** ক্লিক করো

✅ যদি Green status (200) পাও → Backend OK!
❌ যদি Red error পাও → Backend down

---

### **B. USER REGISTRATION**

```
METHOD: POST
URL: http://localhost:5000/api/auth/register

Body (JSON):
{
  "name": "Anthic Kumar Singh",
  "email": "anthic@example.com",
  "password": "SecurePass123!"
}

Expected Response (201):
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "_id": "...",
    "name": "Anthic Kumar Singh",
    "email": "anthic@example.com",
    "role": "user"
  }
}
```

**Postman এ Setup:**
1. নতুন Tab খোলো
2. **POST** সিলেক্ট করো
3. URL: `http://localhost:5000/api/auth/register`
4. **Body** → **raw** → **JSON** সিলেক্ট করো
5. উপরের JSON পেস্ট করো
6. **Send** ক্লিক করো

⚠️ **Note:** একই email দিয়ে দোবারা Register করলে error আসবে। ভিন্ন email দাও।

---

### **C. USER LOGIN**

```
METHOD: POST
URL: http://localhost:5000/api/auth/login

Body (JSON):
{
  "email": "anthic@example.com",
  "password": "SecurePass123!"
}

Expected Response (200):
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "Anthic Kumar Singh",
      "email": "anthic@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Postman এ Setup:**
1. নতুন Tab খোলো
2. **POST** সিলেক্ট করো
3. URL: `http://localhost:5000/api/auth/login`
4. Body এ registration এর email/password দাও
5. **Send** ক্লিক করো

✅ **Important:** `accessToken` copy করে রাখো - পরের API calls এ লাগবে!

---

### **D. GET MY PROFILE**

```
METHOD: GET
URL: http://localhost:5000/api/auth/me
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN

Expected Response (200):
{
  "success": true,
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "_id": "...",
    "name": "Anthic Kumar Singh",
    "email": "anthic@example.com",
    "role": "user"
  }
}
```

**Postman এ Setup:**
1. নতুন Tab খোলো
2. **GET** সিলেক্ট করো
3. URL: `http://localhost:5000/api/auth/me`
4. **Headers** tab এ যাও
5. নতুন header add করো:
   ```
   Key: Authorization
   Value: Bearer YOUR_ACCESS_TOKEN
   ```
   (`YOUR_ACCESS_TOKEN` এর জায়গায় login থেকে পাওয়া token পেস্ট করো)
6. **Send** ক্লিক করো

---

### **E. START RESEARCH (Main Feature!)**

```
METHOD: POST
URL: http://localhost:5000/api/research
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json

Body (JSON):
{
  "topic": "AI in healthcare",
  "maxRetries": 2
}

Expected Response (201):
{
  "success": true,
  "statusCode": 201,
  "message": "Research job started",
  "data": {
    "_id": "job_id_here",
    "userId": "user_id",
    "topic": "AI in healthcare",
    "status": "processing",
    "createdAt": "2026-05-05T...",
    "jobId": "unique_job_id"
  }
}
```

**Postman এ Setup:**
1. নতুন Tab খোলো
2. **POST** সিলেক্ট করো
3. URL: `http://localhost:5000/api/research`
4. **Headers** এ Authorization token add করো
5. **Body** → **raw** → **JSON** এ above JSON পেস্ট করো
6. **Send** ক্লিক করো

⏳ **Note:** Response এ পাওয়া `jobId` copy করো - job status check করতে লাগবে!

---

### **F. CHECK RESEARCH JOB STATUS**

```
METHOD: GET
URL: http://localhost:5000/api/research/job/{jobId}
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN

Replace {jobId} with actual job ID from previous response

Expected Response (200):
{
  "success": true,
  "statusCode": 200,
  "message": "Job details retrieved",
  "data": {
    "_id": "...",
    "status": "completed",
    "result": {
      "report": "...",
      "critiqeScore": 8.5,
      "factCheckScore": 0.92
    }
  }
}
```

**Postman এ Setup:**
1. নতুন Tab খোলো
2. **GET** সিলেক্ট করো
3. URL: `http://localhost:5000/api/research/job/YOUR_JOB_ID`
   (YOUR_JOB_ID এর জায়গায় Step E থেকে পাওয়া jobId পেস্ট করো)
4. **Headers** এ Authorization token add করো
5. **Send** ক্লিক করো

**Job Status:**
- `processing` → কাজ চলছে
- `completed` → কাজ শেষ
- `failed` → Error হয়েছে

---

### **G. GET RESEARCH HISTORY**

```
METHOD: GET
URL: http://localhost:5000/api/research/history
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN

Expected Response (200):
{
  "success": true,
  "statusCode": 200,
  "message": "Research history retrieved",
  "data": [
    {
      "_id": "...",
      "topic": "AI in healthcare",
      "status": "completed",
      "createdAt": "2026-05-05T..."
    },
    ...
  ]
}
```

**Postman এ Setup:**
1. নতুন Tab খোলো
2. **GET** সিলেক্ট করো
3. URL: `http://localhost:5000/api/research/history`
4. **Headers** এ Authorization token add করো
5. **Send** ক্লিক করো

---

## ✅ Backend Verification Checklist

এই checklist এ সব items tick করে দেখো:

```
HEALTH CHECK
  ☐ GET /api/research/health → Status 200
  ☐ Response: "Agent is healthy"

AUTHENTICATION
  ☐ POST /api/auth/register → Status 201
  ☐ User data returned
  ☐ POST /api/auth/login → Status 200
  ☐ accessToken received
  ☐ GET /api/auth/me → Status 200
  ☐ User profile returned

RESEARCH API
  ☐ POST /api/research → Status 201
  ☐ Job ID received
  ☐ GET /api/research/job/{jobId} → Status 200
  ☐ Job status returned
  ☐ GET /api/research/history → Status 200
  ☐ History array returned

VALIDATION
  ☐ Invalid email → Status 400
  ☐ Wrong password → Status 401
  ☐ Missing token → Status 401
  ☐ Invalid token → Status 403
```

---

## 🐛 Common Errors & Solutions

### **Error 1: "Cannot GET /api/research/health"**
```
❌ Problem: Backend server running নেই
✅ Solution: 
   npm run dev চালাও
   Port 5000 free আছে কিনা চেক করো
```

### **Error 2: "401 Unauthorized"**
```
❌ Problem: Authorization token missing অথবা invalid
✅ Solution:
   Login করে নতুন token নাও
   Headers এ "Bearer " prefix যোগ করতে ভুলেছো না?
```

### **Error 3: "400 Bad Request"**
```
❌ Problem: Invalid JSON body অথবা missing fields
✅ Solution:
   JSON format check করো
   Required fields থাকো কিনা দেখো
   Headers এ Content-Type: application/json থাকো
```

### **Error 4: "ECONNREFUSED"**
```
❌ Problem: Backend server responding নেই
✅ Solution:
   npm run dev চালাও
   MongoDB connected আছে কিনা check করো
   Logs দেখো error আছে কিনা
```

---

## 📊 Performance Testing

### Load Test (100 requests)
```bash
# For Windows PowerShell:
$requests = 100
for ($i = 1; $i -le $requests; $i++) {
    Invoke-WebRequest -Uri "http://localhost:5000/api/research/health"
    Write-Host "Request $i completed"
}
```

### Response Time Check
Postman এ:
1. Request send করো
2. Response panel এ "Time" দেখো
3. < 500ms = Good
4. 500-1000ms = Acceptable
5. > 1000ms = Slow

---

## 📁 Postman Collection Export/Import

### Export করতে:
1. Collection এ right-click করো
2. **Export** এ click করো
3. Format: **Collection v2.1**
4. Save করো

### Import করতে (teammates এর জন্য):
1. **Import** button এ click করো
2. Export করা file select করো
3. **Import** এ click করো

---

## 🔐 Security Checks

```
✓ Password hashing working?
  - Register করে password দিয়ে login করতে পারো?
  
✓ Token validation working?
  - Invalid token দিয়ে request করলে error আসে?
  
✓ CORS properly configured?
  - Frontend থেকে request করলে blocked না হয়?
  
✓ Rate limiting working?
  - 100 requests দ্রুত পাঠালে limited হয়?
```

---

## 📝 Testing Scenarios

### Scenario 1: New User Journey
1. Register করো (নতুন email)
2. Login করো
3. Profile retrieve করো
4. Research start করো
5. Job status check করো
6. History দেখো

### Scenario 2: Research Workflow
1. Authenticate করো
2. Multiple research jobs start করো (ভিন্ন topics)
3. All job statuses check করো
4. History sorted by date check করো

### Scenario 3: Error Handling
1. Wrong password দিয়ে login করো → Error?
2. Invalid token দিয়ে research start করো → Error?
3. Missing required fields দিয়ে register করো → Error?

---

## 🎯 Expected API Response Times

| Endpoint | Method | Expected Time |
|----------|--------|----------------|
| /health | GET | < 50ms |
| /auth/register | POST | 100-300ms |
| /auth/login | POST | 100-300ms |
| /auth/me | GET | < 100ms |
| /research | POST | 200-500ms |
| /research/job/{id} | GET | 100-300ms |
| /research/history | GET | 200-500ms |

---

## 💾 Database Check (Optional)

MongoDB তে data save হচ্ছে কিনা check করতে:

```bash
# MongoDB CLI এ:
use multi-agent-research

# Users check করো:
db.users.find()

# Research jobs check করো:
db.researches.find()

# Count করো:
db.users.countDocuments()
db.researches.countDocuments()
```

---

## 🚀 Next Steps

1. ✅ সব endpoints test করো Postman দিয়ে
2. ✅ সব responses verify করো
3. ✅ Frontend connect করো
4. ✅ End-to-end testing করো

---

## 📞 Troubleshooting Checklist

নিচের items check করো যদি কোন problem হয়:

- [ ] Backend server running আছে (npm run dev)
- [ ] Port 5000 available আছে
- [ ] MongoDB connected আছে
- [ ] .env file properly configured আছে
- [ ] All dependencies installed আছে (npm install)
- [ ] Token format correct (Bearer token_value)
- [ ] JSON body properly formatted আছে
- [ ] Headers properly set আছে

---

## 📚 Resources

- [Postman Docs](https://learning.postman.com/)
- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

**এখন Postman খোলো এবং testing শুরু করো! ✨**
