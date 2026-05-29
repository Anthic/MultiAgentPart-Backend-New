#!/usr/bin/env node

/**
 * Backend API Automated Test Script
 * This script tests all backend endpoints automatically
 * 
 * Usage:
 *   node backend-test.js
 *   npm run test:backend
 */

const http = require('http');
const https = require('https');

// ──────────────────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

let testState = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  jobId: null,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

// ──────────────────────────────────────────────────────────────────────────
// Colors for console output
// ──────────────────────────────────────────────────────────────────────────

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  pass: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  fail: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.cyan}▶ ${msg}${colors.reset}`),
  sep: () => console.log(`${colors.dim}${'─'.repeat(70)}${colors.reset}`),
};

// ──────────────────────────────────────────────────────────────────────────
// HTTP Request Helper
// ──────────────────────────────────────────────────────────────────────────

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Test Cases
// ──────────────────────────────────────────────────────────────────────────

async function testHealthCheck() {
  log.section('1. Health Check');

  try {
    const response = await makeRequest('GET', `${API_BASE}/research/health`);

    if (response.status === 200) {
      log.pass(`Health check passed (Status: ${response.status})`);
      return true;
    } else {
      log.fail(`Health check failed (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    log.fail(`Health check error: ${error.message}`);
    return false;
  }
}

async function testRegister() {
  log.section('2. User Registration');

  try {
    const body = {
      name: 'Test User',
      email: testState.email,
      password: testState.password,
    };

    const response = await makeRequest('POST', `${API_BASE}/auth/register`, body);

    if (response.status === 201) {
      testState.userId = response.body.data?._id;
      log.pass(`Registration successful (Status: ${response.status})`);
      log.info(`Email: ${testState.email}`);
      return true;
    } else {
      log.fail(`Registration failed (Status: ${response.status})`);
      log.info(`Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    log.fail(`Registration error: ${error.message}`);
    return false;
  }
}

async function testLogin() {
  log.section('3. User Login');

  try {
    const body = {
      email: testState.email,
      password: testState.password,
    };

    const response = await makeRequest('POST', `${API_BASE}/auth/login`, body);

    if (response.status === 200) {
      testState.accessToken = response.body.data?.accessToken;
      testState.refreshToken = response.body.data?.refreshToken;
      log.pass(`Login successful (Status: ${response.status})`);
      log.info(`Token received: ${testState.accessToken?.substring(0, 20)}...`);
      return true;
    } else {
      log.fail(`Login failed (Status: ${response.status})`);
      log.info(`Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    log.fail(`Login error: ${error.message}`);
    return false;
  }
}

async function testGetProfile() {
  log.section('4. Get User Profile');

  if (!testState.accessToken) {
    log.warn('No access token available, skipping test');
    return false;
  }

  try {
    const headers = {
      'Authorization': `Bearer ${testState.accessToken}`,
    };

    const response = await makeRequest('GET', `${API_BASE}/auth/me`, null, headers);

    if (response.status === 200) {
      log.pass(`Get profile successful (Status: ${response.status})`);
      log.info(`User: ${response.body.data?.email}`);
      return true;
    } else {
      log.fail(`Get profile failed (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    log.fail(`Get profile error: ${error.message}`);
    return false;
  }
}

async function testStartResearch() {
  log.section('5. Start Research Job');

  if (!testState.accessToken) {
    log.warn('No access token available, skipping test');
    return false;
  }

  try {
    const body = {
      topic: 'Artificial Intelligence in Healthcare',
      maxRetries: 2,
    };

    const headers = {
      'Authorization': `Bearer ${testState.accessToken}`,
    };

    const response = await makeRequest('POST', `${API_BASE}/research`, body, headers);

    if (response.status === 201) {
      testState.jobId = response.body.data?.jobId || response.body.data?._id;
      log.pass(`Research started successfully (Status: ${response.status})`);
      log.info(`Job ID: ${testState.jobId}`);
      log.info(`Status: ${response.body.data?.status}`);
      return true;
    } else {
      log.fail(`Research start failed (Status: ${response.status})`);
      log.info(`Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    log.fail(`Research start error: ${error.message}`);
    return false;
  }
}

async function testGetJobStatus() {
  log.section('6. Get Research Job Status');

  if (!testState.accessToken || !testState.jobId) {
    log.warn('No access token or job ID available, skipping test');
    return false;
  }

  try {
    const headers = {
      'Authorization': `Bearer ${testState.accessToken}`,
    };

    const response = await makeRequest('GET', `${API_BASE}/research/job/${testState.jobId}`, null, headers);

    if (response.status === 200) {
      log.pass(`Get job status successful (Status: ${response.status})`);
      log.info(`Status: ${response.body.data?.status}`);
      return true;
    } else {
      log.fail(`Get job status failed (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    log.fail(`Get job status error: ${error.message}`);
    return false;
  }
}

async function testGetHistory() {
  log.section('7. Get Research History');

  if (!testState.accessToken) {
    log.warn('No access token available, skipping test');
    return false;
  }

  try {
    const headers = {
      'Authorization': `Bearer ${testState.accessToken}`,
    };

    const response = await makeRequest('GET', `${API_BASE}/research/history`, null, headers);

    if (response.status === 200) {
      const count = response.body.data?.length || 0;
      log.pass(`Get history successful (Status: ${response.status})`);
      log.info(`Found ${count} research items`);
      return true;
    } else {
      log.fail(`Get history failed (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    log.fail(`Get history error: ${error.message}`);
    return false;
  }
}

async function testErrorHandling() {
  log.section('8. Error Handling Tests');

  const tests = [];

  // Test 1: Invalid credentials
  try {
    const body = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    };
    const response = await makeRequest('POST', `${API_BASE}/auth/login`, body);
    if (response.status === 401) {
      log.pass('Invalid credentials returns 401');
      tests.push(true);
    } else {
      log.fail(`Invalid credentials should return 401, got ${response.status}`);
      tests.push(false);
    }
  } catch (error) {
    log.fail(`Invalid credentials test error: ${error.message}`);
    tests.push(false);
  }

  // Test 2: Missing authorization
  try {
    const response = await makeRequest('GET', `${API_BASE}/research/history`, null, {});
    if (response.status === 401) {
      log.pass('Missing auth token returns 401');
      tests.push(true);
    } else {
      log.warn(`Missing auth token returned ${response.status} instead of 401`);
      tests.push(false);
    }
  } catch (error) {
    log.fail(`Missing auth test error: ${error.message}`);
    tests.push(false);
  }

  // Test 3: Invalid JSON
  try {
    const headers = { 'Content-Type': 'application/json' };
    // This test would need raw HTTP request, skipping for now
    log.info('Invalid JSON test skipped (requires raw HTTP)');
  } catch (error) {
    log.fail(`Invalid JSON test error: ${error.message}`);
    tests.push(false);
  }

  return tests.filter(t => t).length >= 1;
}

// ──────────────────────────────────────────────────────────────────────────
// Main Test Runner
// ──────────────────────────────────────────────────────────────────────────

async function runAllTests() {
  log.title(`${'='.repeat(70)}`);
  log.title('🧪 BACKEND API TEST SUITE');
  log.title(`${'='.repeat(70)}`);

  log.info(`Target: ${BASE_URL}`);
  log.info(`Start Time: ${new Date().toLocaleString()}`);
  log.sep();

  const results = [];

  // Run tests in sequence
  results.push({ name: 'Health Check', passed: await testHealthCheck() });
  results.push({ name: 'User Registration', passed: await testRegister() });
  results.push({ name: 'User Login', passed: await testLogin() });
  results.push({ name: 'Get Profile', passed: await testGetProfile() });
  results.push({ name: 'Start Research', passed: await testStartResearch() });
  results.push({ name: 'Get Job Status', passed: await testGetJobStatus() });
  results.push({ name: 'Get History', passed: await testGetHistory() });
  results.push({ name: 'Error Handling', passed: await testErrorHandling() });

  // Summary
  log.sep();
  log.section('Test Summary');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = (passed / total * 100).toFixed(1);

  results.forEach(result => {
    if (result.passed) {
      log.pass(`${result.name}`);
    } else {
      log.fail(`${result.name}`);
    }
  });

  log.sep();
  if (passed === total) {
    log.pass(`${colors.bright}ALL TESTS PASSED (${passed}/${total} - 100%)${colors.reset}`);
  } else if (passed >= total / 2) {
    log.warn(`${passed}/${total} tests passed (${percentage}%)`);
  } else {
    log.fail(`${passed}/${total} tests passed (${percentage}%)`);
  }

  log.info(`End Time: ${new Date().toLocaleString()}`);
  log.title(`${'='.repeat(70)}\n`);

  process.exit(passed === total ? 0 : 1);
}

// ──────────────────────────────────────────────────────────────────────────
// Run Tests
// ──────────────────────────────────────────────────────────────────────────

runAllTests().catch(error => {
  log.fail(`Unexpected error: ${error.message}`);
  process.exit(1);
});
