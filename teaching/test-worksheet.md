# StockLite Integration Test Worksheet

**Application**: StockLite — Inventory Tracker  
**Test environment**: Development  
**Database**: Supabase PostgreSQL with RLS  
**Storage**: Supabase Storage (private bucket)  
**Tester name**: _________________________  
**Date**: _________________________  

## Instructions

Execute each test case in order. Record the actual result, mark Pass/Fail, and capture evidence (screenshot or log excerpt) when a defect occurs. For failed tests, document the defect and propose or implement a corrective action, then retest.

Leave **Actual Result** and **Evidence** columns blank initially. The example rows below show the expected format.

---

## Test Cases

### TC-01: Add a valid product

**Preconditions**: Signed in with a valid account  
**Input**:
- SKU: `TEST-001`
- Name: `Test product`
- Category: `Office supplies`
- Price: `25.00`
- Opening quantity: `10`
- Low-stock threshold: `3`

**Steps**:
1. Click **+ Add product**
2. Fill all fields with the input above
3. Click **Save product**
4. Reload the page

**Expected result**: Product appears in the list with 10 units and one opening movement

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Screenshot or log excerpt

---

### TC-02: Submit missing or invalid fields

**Preconditions**: Signed in, on Add product form  
**Input**: Leave Name blank, enter `-5` in Price

**Steps**:
1. Open Add product form
2. Fill SKU only, leave Name empty
3. Enter `-5` in Price
4. Click Save product

**Expected result**: Clear validation feedback; no invalid record saved

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Screenshot of validation messages

---

### TC-03: Add a duplicate SKU

**Preconditions**: Product `TEST-001` exists in the current account  
**Input**: SKU `TEST-001`, Name `Duplicate`, valid other fields

**Steps**:
1. Open Add product form
2. Enter SKU `TEST-001` (already exists)
3. Fill remaining fields
4. Click Save product

**Expected result**: Duplicate SKU rejected with clear error message

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Error message screenshot

---

### TC-04: Stock In — 10 + 5

**Preconditions**: Product exists with current quantity 10  
**Input**: Type: `Stock In`, Quantity: `5`, Note: `Received five`

**Steps**:
1. Open product details
2. Select Stock In
3. Enter quantity 5
4. Enter note
5. Click Save movement
6. Verify balance and history

**Expected result**: Balance becomes 15, one new IN movement (10 → 15)

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Screenshot of updated balance and movement

---

### TC-05: Stock Out — 15 − 3

**Preconditions**: Product balance is 15 (from TC-04)  
**Input**: Type: `Stock Out`, Quantity: `3`, Note: `Released three`

**Steps**:
1. Open product details
2. Select Stock Out
3. Enter quantity 3
4. Enter note
5. Click Save movement
6. Verify balance and history

**Expected result**: Balance becomes 12, one new OUT movement (15 → 12)

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Screenshot of final balance 12

---

### TC-06: Stock Out exceeds available stock

**Preconditions**: Product balance is 12  
**Input**: Type: `Stock Out`, Quantity: `15`

**Steps**:
1. Open product details
2. Select Stock Out
3. Enter quantity 15 (exceeds balance)
4. Click Save movement
5. Verify balance and history remain unchanged

**Expected result**: Request rejected, balance stays 12, no new movement

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Error message screenshot

---

### TC-07: Submit negative or fractional quantity

**Preconditions**: On movement form  
**Input**: Quantity: `-5`, then `2.5`

**Steps**:
1. Open movement form
2. Enter `-5` in quantity
3. Attempt to save
4. Enter `2.5` in quantity
5. Attempt to save

**Expected result**: Both rejected with validation feedback

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Validation message screenshot

---

### TC-08: Reload product and history

**Preconditions**: Completed TC-04 and TC-05  
**Input**: N/A

**Steps**:
1. Note current balance (should be 12)
2. Note movement count (should be 3: opening, +5, −3)
3. Reload the page
4. Open the same product
5. Verify balance and history

**Expected result**: Balance 12, three movements with correct details

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Screenshot after reload

---

### TC-09: Upload an allowed product photo

**Preconditions**: Product exists  
**Input**: JPEG file, size < 2 MB

**Steps**:
1. Open Edit product
2. Click Choose file
3. Select a valid JPEG or PNG under 2 MB
4. Click Save product
5. Reload and verify photo displays

**Expected result**: Photo uploads, saves, and displays after reload

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Screenshot of displayed photo

---

### TC-10: Upload an oversized or unsupported file

**Preconditions**: On Edit product form  
**Input**: File > 2 MB or unsupported type (e.g., .txt)

**Steps**:
1. Open Edit product
2. Select oversized or unsupported file
3. Attempt to save

**Expected result**: Clear rejection with option to retry or skip photo

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Error message screenshot

---

### TC-11: Storage request fails

**Preconditions**: Teaching defect mode enabled or storage misconfigured  
**Input**: Valid photo file

**Steps**:
1. Activate storage-failure teaching defect (if available)
2. Open Edit product
3. Select a valid photo
4. Attempt to save
5. Observe error handling

**Expected result**: Clear error, app stays usable, no false success message

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Error screenshot and console log

---

### TC-12: Stock reaches threshold

**Preconditions**: Product with threshold 3, current stock variable  
**Input**: Adjust stock to exactly 3, then to 2

**Steps**:
1. Set or adjust stock to exactly 3 units
2. Verify low-stock badge appears
3. Stock out 1 unit (balance becomes 2)
4. Verify low-stock badge remains
5. Check dashboard low-stock count

**Expected result**: Low-stock indicator appears at threshold and below

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Screenshot of low-stock badge

---

### TC-13: Retry the same movement request

**Preconditions**: Product balance known  
**Input**: Stock In 7 units with note "Test idempotency"

**Steps**:
1. Open movement form
2. Enter quantity 7, note "Test idempotency"
3. Save movement
4. Note the new balance
5. Without changing values, click Save again
6. Verify movement is not duplicated

**Expected result**: Movement applied exactly once; second save reuses request ID

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Screenshot of movement history showing one entry

---

### TC-14: Two competing stock-out requests

**Preconditions**: Product balance 12, two browser tabs open  
**Input**: Tab 1: Stock Out 10; Tab 2: Stock Out 10

**Steps**:
1. Open product in two browser tabs
2. In Tab 1, start Stock Out 10
3. In Tab 2, start Stock Out 10 immediately
4. Submit both quickly
5. Reload and verify final balance

**Expected result**: One succeeds, one rejected; no negative stock or lost update

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Screenshot of final balance and error message

---

### TC-15: Access another account's product or image

**Preconditions**: Two test accounts with separate inventories  
**Input**: Product ID or photo URL from Account A

**Steps**:
1. Sign in as Account A, create a product, note its ID
2. Sign in as Account B
3. Attempt to access Account A's product via direct URL or API
4. Attempt to access Account A's photo URL

**Expected result**: Access denied; no data leakage

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Network tab screenshot showing 403 or equivalent

---

### TC-16: Create → upload → stock in → stock out → reload

**Preconditions**: Signed in, starting with empty inventory  
**Input**: Full product with photo, opening 20, threshold 5, then +8, then −6

**Steps**:
1. Add product: SKU `FULL-01`, Name `Full workflow test`, Category `Testing`, Price 15.00, Opening 20, Threshold 5, upload photo
2. Save and verify product appears
3. Open product, Stock In 8 units ("Additional batch")
4. Stock Out 6 units ("Released for testing")
5. Reload page
6. Open product and verify balance 22, four movements, photo displays

**Expected result**: Final balance 22 (20 + 8 − 6), complete history, photo visible

**Actual result**: _______________________________________________________________

**Status**: ☐ Pass  ☐ Fail

**Defect**: ____________________________________________________________________

**Corrective action**: __________________________________________________________

**Retest result**: ☐ Pass  ☐ Fail  ☐ N/A

**Evidence**: Screenshot of final product state

---

## Summary

**Tests executed**: _____ of 16  
**Passed**: _____  
**Failed**: _____  
**Blocked**: _____  

**Critical defects found**: ____________________________________________________

**Recommended actions**: ________________________________________________________

**Tester signature**: ________________________  **Date**: ____________________

**Reviewer**: ________________________  **Date**: ____________________
