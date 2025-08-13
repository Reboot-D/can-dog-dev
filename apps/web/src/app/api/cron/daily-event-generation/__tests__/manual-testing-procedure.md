# Manual Testing Procedure: Daily Event Generation Cron Job

## Overview
This document provides step-by-step instructions for manually testing the daily event generation cron job both locally and on Vercel.

## Prerequisites

### Local Testing Prerequisites
- Node.js and pnpm installed
- Local development environment running (`pnpm dev`)
- Access to test database with sample pets
- Environment variables configured (`.env.local`)

### Production Testing Prerequisites
- Deployed application on Vercel
- Access to Vercel dashboard
- Production database with sample pets
- Environment variables configured on Vercel (including `CRON_SECRET` if used)

## Test Scenarios

### 1. Authentication Testing

#### Test 1.1: Invalid Authentication (Local)
```bash
# Test without required headers
curl -X POST http://localhost:3000/api/cron/daily-event-generation \
  -H "Content-Type: application/json"

# Expected: 401 Unauthorized with "Missing or invalid x-vercel-cron header"
```

#### Test 1.2: Valid Authentication (Local)
```bash
# Test with valid Vercel cron header
curl -X POST http://localhost:3000/api/cron/daily-event-generation \
  -H "Content-Type: application/json" \
  -H "x-vercel-cron: 1"

# Expected: 200 OK with job execution results
```

#### Test 1.3: CRON_SECRET Authentication (Local with Secret)
```bash
# Set CRON_SECRET in .env.local first
# CRON_SECRET=your-secret-key

# Test without authorization header
curl -X POST http://localhost:3000/api/cron/daily-event-generation \
  -H "Content-Type: application/json" \
  -H "x-vercel-cron: 1"

# Expected: 401 Unauthorized

# Test with correct authorization
curl -X POST http://localhost:3000/api/cron/daily-event-generation \
  -H "Content-Type: application/json" \
  -H "x-vercel-cron: 1" \
  -H "Authorization: Bearer your-secret-key"

# Expected: 200 OK with job execution results
```

### 2. Database Operation Testing

#### Test 2.1: Empty Database
1. Ensure test database has no pets
2. Execute the cron job endpoint
3. **Expected Result:**
   ```json
   {
     "success": true,
     "totalPets": 0,
     "processedPets": 0,
     "totalEventsCreated": 0,
     "totalEventsSkipped": 0,
     "failedPets": 0,
     "errors": [],
     "executionTimeMs": [number],
     "timestamp": "[ISO timestamp]"
   }
   ```

#### Test 2.2: Single Pet Processing
1. Add one test pet to the database
2. Execute the cron job endpoint
3. **Expected Result:**
   - `totalPets`: 1
   - `processedPets`: 1
   - `totalEventsCreated`: > 0 (depends on care schedules)
   - `failedPets`: 0
   - `success`: true

#### Test 2.3: Multiple Pets Processing
1. Add 3-5 test pets with different breeds and ages
2. Execute the cron job endpoint
3. **Expected Result:**
   - `totalPets`: [number of pets]
   - `processedPets`: [number of pets]
   - `totalEventsCreated`: > 0
   - `failedPets`: 0
   - `success`: true

### 3. Error Handling Testing

#### Test 3.1: Database Connection Failure
1. Temporarily modify database connection settings to invalid values
2. Execute the cron job endpoint
3. **Expected Result:**
   - `success`: false
   - `errors`: Contains database connection error
   - Status code: 500

#### Test 3.2: Invalid Pet Data
1. Manually insert a pet with invalid/null `date_of_birth`
2. Execute the cron job endpoint
3. **Expected Result:**
   - `success`: true (partial success)
   - `failedPets`: 1
   - `errors`: Contains error for the invalid pet
   - Other pets should still be processed successfully

### 4. Vercel Production Testing

#### Test 4.1: Manual Cron Job Trigger
1. Login to Vercel Dashboard
2. Navigate to your project
3. Go to Functions → Crons
4. Find the "daily-event-generation" cron job
5. Click "Run" to manually trigger
6. Check the function logs for execution results

#### Test 4.2: Scheduled Execution Verification
1. Wait for the scheduled execution time (configured for daily at UTC+8)
2. Check Vercel function logs around the scheduled time
3. Verify the cron job executed automatically
4. Check database for newly created events

### 5. Performance Testing

#### Test 5.1: Large Dataset Processing
1. Create a test database with 50+ pets
2. Execute the cron job endpoint
3. **Verify:**
   - Execution completes within timeout limits (< 5 minutes for Vercel)
   - Memory usage remains reasonable
   - All pets are processed successfully
   - `executionTimeMs` is logged

#### Test 5.2: Idempotency Testing
1. Execute the cron job endpoint twice in succession
2. **Verify:**
   - Second execution shows higher `totalEventsSkipped` count
   - No duplicate events are created in the database
   - Both executions complete successfully

### 6. Logging Verification

#### Test 6.1: Success Logging
1. Execute cron job with successful processing
2. Check console logs for:
   - "Daily event generation cron job started"
   - Individual pet processing results
   - "Daily event generation completed"
   - Execution metrics

#### Test 6.2: Error Logging
1. Execute cron job with forced errors (invalid data)
2. Check console logs for:
   - Authentication failure logs (if applicable)
   - Individual pet processing errors
   - Critical error logs with full context

### 7. HTTP Method Testing

#### Test 7.1: Invalid HTTP Methods
```bash
# Test GET method
curl -X GET http://localhost:3000/api/cron/daily-event-generation

# Test PUT method
curl -X PUT http://localhost:3000/api/cron/daily-event-generation

# Expected: 405 Method Not Allowed for both
```

## Test Data Setup

### Sample Pet Data for Testing
```sql
-- Insert test pets with various scenarios
INSERT INTO pets (id, user_id, name, breed, date_of_birth, created_at, updated_at) VALUES
('test-pet-1', 'test-user-1', 'Buddy', 'Golden Retriever', '2022-01-01', NOW(), NOW()),
('test-pet-2', 'test-user-1', 'Max', 'German Shepherd', '2021-06-15', NOW(), NOW()),
('test-pet-3', 'test-user-2', 'Luna', 'Persian Cat', '2023-03-10', NOW(), NOW()),
('test-pet-4', 'test-user-2', 'Charlie', 'Labrador', '2020-12-25', NOW(), NOW());

-- Insert pet with invalid birth date for error testing
INSERT INTO pets (id, user_id, name, breed, date_of_birth, created_at, updated_at) VALUES
('test-pet-invalid', 'test-user-3', 'Invalid Pet', 'Unknown', NULL, NOW(), NOW());
```

## Environment Variables Checklist

### Required Environment Variables
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)

### Optional Environment Variables
- `CRON_SECRET` (for additional authentication security)

## Troubleshooting Guide

### Common Issues and Solutions

1. **401 Unauthorized Error**
   - Verify `x-vercel-cron: 1` header is present
   - Check `CRON_SECRET` environment variable if configured
   - Ensure authorization header format: `Bearer <token>`

2. **500 Database Error**
   - Verify database connection settings
   - Check Supabase service role key permissions
   - Ensure pets table exists and is accessible

3. **Timeout Errors**
   - Check dataset size (reduce for testing)
   - Verify no infinite loops in event generation logic
   - Monitor execution time logs

4. **No Events Created**
   - Verify pets have valid `date_of_birth` values
   - Check care schedule configuration
   - Ensure no existing events prevent new creation

## Success Criteria

### All tests pass if:
1. ✅ Authentication works correctly for both valid and invalid requests
2. ✅ Database operations handle all scenarios (empty, single, multiple pets)
3. ✅ Error handling gracefully manages failures without crashing
4. ✅ Performance remains acceptable for reasonable dataset sizes
5. ✅ Logging provides sufficient information for monitoring
6. ✅ HTTP methods are properly restricted
7. ✅ Vercel cron job executes on schedule in production
8. ✅ Idempotency prevents duplicate event creation