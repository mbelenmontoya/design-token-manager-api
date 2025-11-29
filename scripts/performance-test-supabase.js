#!/usr/bin/env node

/**
 * Performance Test Suite for Supabase Operations
 *
 * Tests token operations under load to establish performance baselines.
 * Targets: <200ms response time, handles 100+ concurrent users
 */

import { createTestToken } from '../tests/helpers/testFactories.js';

// Configuration
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
const API_KEY = process.env.API_KEY;
const TENANT_ID = process.env.TENANT_ID;
const PROJECT_ID = process.env.PROJECT_ID;

// Performance targets
const TARGET_RESPONSE_TIME_MS = 200;
const CONCURRENT_USERS = 100;
const REQUESTS_PER_USER = 5;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  log(`  ${title}`, colors.cyan);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

function logResult(passed, message) {
  const symbol = passed ? '✅' : '❌';
  const color = passed ? colors.green : colors.red;
  log(`${symbol} ${message}`, color);
}

// Validate environment
if (!API_KEY || !TENANT_ID || !PROJECT_ID) {
  log('❌ Missing required environment variables:', colors.red);
  log('   API_KEY, TENANT_ID, PROJECT_ID must be set', colors.yellow);
  process.exit(1);
}

// HTTP client
async function request(method, path, body = null) {
  const startTime = Date.now();

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'x-tenant-id': TENANT_ID,
        'x-project-id': PROJECT_ID
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: response.status,
      data,
      duration,
      success: response.status >= 200 && response.status < 300
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      status: 0,
      data: null,
      duration: endTime - startTime,
      success: false,
      error: error.message
    };
  }
}

// Calculate statistics
function calculateStats(durations) {
  const sorted = durations.sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length,
    p50: sorted[Math.floor(sorted.length * 0.50)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)]
  };
}

// Test 1: Single request baseline
async function testBaseline() {
  logSection('Test 1: Baseline Performance (Single Request)');

  const durations = [];
  const results = { success: 0, failed: 0 };

  log('Testing GET /api/v1/tokens (10 requests)...', colors.yellow);

  for (let i = 0; i < 10; i++) {
    const result = await request('GET', '/api/v1/tokens');
    durations.push(result.duration);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }

    process.stdout.write('.');
  }

  console.log('\n');

  const stats = calculateStats(durations);

  log(`Results:`, colors.cyan);
  log(`  Successful: ${results.success}/10`);
  log(`  Failed: ${results.failed}/10`);
  log(`  Min: ${stats.min}ms`);
  log(`  Avg: ${stats.avg.toFixed(2)}ms`);
  log(`  Max: ${stats.max}ms`);
  log(`  P95: ${stats.p95}ms`);
  log(`  P99: ${stats.p99}ms`);

  const passed = stats.p95 < TARGET_RESPONSE_TIME_MS && results.failed === 0;
  logResult(passed, `Baseline P95 ${stats.p95}ms < ${TARGET_RESPONSE_TIME_MS}ms target`);

  return { passed, stats, results };
}

// Test 2: Pagination performance
async function testPagination() {
  logSection('Test 2: Pagination Performance');

  const durations = [];
  const pageSizes = [10, 20, 50, 100];

  log('Testing pagination with different page sizes...', colors.yellow);

  for (const pageSize of pageSizes) {
    const result = await request('GET', `/api/v1/tokens?limit=${pageSize}`);
    durations.push(result.duration);

    if (result.success) {
      const tokenCount = Array.isArray(result.data.tokens) ? result.data.tokens.length : 0;
      log(`  Page size ${pageSize}: ${result.duration}ms (${tokenCount} tokens)`);
    } else {
      log(`  Page size ${pageSize}: FAILED`, colors.red);
    }
  }

  const stats = calculateStats(durations);

  log(`\nPagination Stats:`, colors.cyan);
  log(`  Avg: ${stats.avg.toFixed(2)}ms`);
  log(`  Max: ${stats.max}ms`);

  const passed = stats.max < TARGET_RESPONSE_TIME_MS * 1.5; // Allow 1.5x for larger pages
  logResult(passed, `Pagination performance acceptable (${stats.max}ms < ${TARGET_RESPONSE_TIME_MS * 1.5}ms)`);

  return { passed, stats };
}

// Test 3: Filtering performance
async function testFiltering() {
  logSection('Test 3: Filtering Performance');

  const durations = [];
  const categories = ['color', 'spacing', 'typography', 'shadow'];

  log('Testing category filtering...', colors.yellow);

  for (const category of categories) {
    const result = await request('GET', `/api/v1/tokens?category=${category}`);
    durations.push(result.duration);

    if (result.success) {
      const tokenCount = Array.isArray(result.data.tokens) ? result.data.tokens.length : 0;
      log(`  Category '${category}': ${result.duration}ms (${tokenCount} tokens)`);
    } else {
      log(`  Category '${category}': FAILED`, colors.red);
    }
  }

  const stats = calculateStats(durations);

  log(`\nFiltering Stats:`, colors.cyan);
  log(`  Avg: ${stats.avg.toFixed(2)}ms`);
  log(`  Max: ${stats.max}ms`);

  const passed = stats.avg < TARGET_RESPONSE_TIME_MS;
  logResult(passed, `Filtering performance acceptable (${stats.avg.toFixed(2)}ms < ${TARGET_RESPONSE_TIME_MS}ms)`);

  return { passed, stats };
}

// Test 4: Bulk token creation
async function testBulkCreation() {
  logSection('Test 4: Bulk Token Creation Performance');

  const durations = [];
  const batchSizes = [1, 5, 10, 20];
  const createdIds = [];

  log('Testing bulk token creation...', colors.yellow);

  for (const batchSize of batchSizes) {
    const batchStart = Date.now();

    for (let i = 0; i < batchSize; i++) {
      const tokenData = createTestToken({
        name: `perf-test-${Date.now()}-${i}`
      });

      const result = await request('POST', '/api/v1/tokens', tokenData);

      if (result.success && result.data.id) {
        createdIds.push(result.data.id);
      }
    }

    const batchDuration = Date.now() - batchStart;
    durations.push(batchDuration);

    log(`  Batch size ${batchSize}: ${batchDuration}ms (${(batchDuration / batchSize).toFixed(2)}ms avg per token)`);
  }

  const stats = calculateStats(durations);

  log(`\nBulk Creation Stats:`, colors.cyan);
  log(`  Avg batch time: ${stats.avg.toFixed(2)}ms`);
  log(`  Max batch time: ${stats.max}ms`);
  log(`  Created tokens: ${createdIds.length}`);

  // Cleanup
  log('\nCleaning up test tokens...', colors.yellow);
  let cleanedUp = 0;
  for (const id of createdIds) {
    const result = await request('DELETE', `/api/v1/tokens/${id}`);
    if (result.success) cleanedUp++;
  }
  log(`  Cleaned up ${cleanedUp}/${createdIds.length} tokens`);

  const passed = stats.avg < TARGET_RESPONSE_TIME_MS * 10; // More lenient for bulk ops
  logResult(passed, `Bulk creation performance acceptable`);

  return { passed, stats };
}

// Test 5: Concurrent users simulation
async function testConcurrentUsers() {
  logSection('Test 5: Concurrent Users Simulation');

  log(`Simulating ${CONCURRENT_USERS} concurrent users...`, colors.yellow);
  log(`Each user makes ${REQUESTS_PER_USER} requests`, colors.yellow);

  const startTime = Date.now();
  const durations = [];
  const results = { success: 0, failed: 0 };

  // Create concurrent user requests
  const userPromises = [];

  for (let user = 0; user < CONCURRENT_USERS; user++) {
    const userRequests = async () => {
      for (let req = 0; req < REQUESTS_PER_USER; req++) {
        const result = await request('GET', '/api/v1/tokens?limit=10');
        durations.push(result.duration);

        if (result.success) {
          results.success++;
        } else {
          results.failed++;
        }
      }
    };

    userPromises.push(userRequests());
  }

  // Execute all concurrent requests
  await Promise.all(userPromises);

  const totalTime = Date.now() - startTime;
  const totalRequests = CONCURRENT_USERS * REQUESTS_PER_USER;

  const stats = calculateStats(durations);

  log(`\nConcurrency Results:`, colors.cyan);
  log(`  Total requests: ${totalRequests}`);
  log(`  Total time: ${totalTime}ms`);
  log(`  Throughput: ${(totalRequests / (totalTime / 1000)).toFixed(2)} req/s`);
  log(`  Successful: ${results.success}/${totalRequests}`);
  log(`  Failed: ${results.failed}/${totalRequests}`);
  log(`\nResponse Times:`, colors.cyan);
  log(`  Min: ${stats.min}ms`);
  log(`  Avg: ${stats.avg.toFixed(2)}ms`);
  log(`  Max: ${stats.max}ms`);
  log(`  P50: ${stats.p50}ms`);
  log(`  P95: ${stats.p95}ms`);
  log(`  P99: ${stats.p99}ms`);

  const passed = stats.p95 < TARGET_RESPONSE_TIME_MS * 2 && results.failed === 0; // Allow 2x during high load
  logResult(passed, `Concurrent load handling acceptable (P95: ${stats.p95}ms, 0 failures)`);

  return { passed, stats, results, totalTime, throughput: totalRequests / (totalTime / 1000) };
}

// Main test runner
async function runPerformanceTests() {
  log('\n🚀 Performance Test Suite for Supabase Operations\n', colors.cyan);
  log(`Configuration:`, colors.yellow);
  log(`  Base URL: ${BASE_URL}`);
  log(`  Target Response Time: ${TARGET_RESPONSE_TIME_MS}ms`);
  log(`  Concurrent Users: ${CONCURRENT_USERS}`);
  log(`  Requests per User: ${REQUESTS_PER_USER}`);

  const allResults = {
    baseline: null,
    pagination: null,
    filtering: null,
    bulkCreation: null,
    concurrentUsers: null
  };

  try {
    allResults.baseline = await testBaseline();
    allResults.pagination = await testPagination();
    allResults.filtering = await testFiltering();
    allResults.bulkCreation = await testBulkCreation();
    allResults.concurrentUsers = await testConcurrentUsers();

    // Final summary
    logSection('Performance Test Summary');

    const allPassed = Object.values(allResults).every(r => r && r.passed);

    log('Test Results:', colors.cyan);
    logResult(allResults.baseline.passed, `Baseline Performance`);
    logResult(allResults.pagination.passed, `Pagination Performance`);
    logResult(allResults.filtering.passed, `Filtering Performance`);
    logResult(allResults.bulkCreation.passed, `Bulk Creation Performance`);
    logResult(allResults.concurrentUsers.passed, `Concurrent Users Load`);

    console.log('');

    if (allPassed) {
      log('🎉 All performance tests passed!', colors.green);
      process.exit(0);
    } else {
      log('⚠️  Some performance tests failed', colors.yellow);
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ Performance test suite failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runPerformanceTests();
