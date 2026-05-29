# ⚡ Backend Testing - Quick Start (30 সেকেন্ডে!)

## 3 Step এ Backend Test করো

### Step 1: Server চালু করো (Terminal 1)
```bash
cd s:\Anthic\ kumar\ singh\MultiAgentResearch\MultiAgentPart-Backend
npm run dev
```

Wait for: `Application listening on port 5000`

---

### Step 2: Automated Test চালাও (Terminal 2)
```bash
cd s:\Anthic\ kumar\ singh\MultiAgentResearch\MultiAgentPart-Backend
npm run test:backend
```

**Expected Result:**
```
✓ ALL TESTS PASSED (8/8 - 100%)
```

---

### Step 3 (Optional): Manual Postman Test

#### A. Postman খোলো এবং Health Check করো

```
GET http://localhost:5000/api/research/health

Response: {
  "success": true,
  "message": "Agent is healthy"
}
```

#### B. User Register করো

```
POST http://localhost:5000/api/auth/register

Body: {
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test123!"
}
```

#### C. Login করো

```
POST http://localhost:5000/api/auth/login

Body: {
  "email": "test@example.com",
  "password": "Test123!"
}

Response: {
  "accessToken": "token_here_copy_this"
}
```

#### D. Research Start করো

```
POST http://localhost:5000/api/research

Headers:
  Authorization: Bearer token_here_from_step_c

Body: {
  "topic": "AI in healthcare",
  "maxRetries": 2
}

Response: {
  "jobId": "job_id_here"
}
```

#### E. Job Status Check করো

```
GET http://localhost:5000/api/research/job/job_id_here

Headers:
  Authorization: Bearer token_here
```

---

## ✅ Everything Working?

- ✅ npm run dev → Server চলেছে (port 5000)
- ✅ npm run test:backend → সব test pass
- ✅ Postman health check → 200 status
- ✅ Register → নতুন user created
- ✅ Login → token পাচ্ছো
- ✅ Research → job start হয়েছে

**If all YES → Backend ঠিক আছে! 🎉**

---

## 🔗 Full Documentation

- 📘 [Postman Testing Guide](./POSTMAN_TESTING_GUIDE.md)
- 📗 [Bengali Testing Guide](./BACKEND_TESTING_BENGALI.md)
- 🧪 [Automated Testing Script](./backend-test.js)

---

## 🐛 Troubleshooting (2 minutes)

**Server won't start?**
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Try again
npm run dev
```

**Test fails?**
```bash
# Check .env file exists
cat .env

# Install dependencies
npm install

# Run dev server in another terminal
npm run dev

# Then run test
npm run test:backend
```

**Database error?**
```bash
# Make sure MongoDB is running
# Update DATABASE_URL in .env
# Restart server
npm run dev
```

---

## 📚 Next Steps

1. ✅ Backend testing done
2. ➡️ Now connect Frontend
3. ➡️ Test full integration
4. ➡️ Deploy to production

---

**That's it! You're done testing! 🚀**
