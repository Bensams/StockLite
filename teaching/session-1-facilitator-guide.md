# Session 1: Third-Party Integration (Supabase Storage)

**Facilitator Guide**

**Duration**: 120 minutes  
**Topic**: Connect product photo upload to Supabase Storage  
**Deliverable**: Working photo upload with evidence of integration  

---

## Session Overview

Students configure Supabase Storage, implement photo upload in a prepared starter, test the integration, and handle success and failure scenarios.

**Learning objectives**:
1. Configure a cloud storage service and bucket policies
2. Integrate a third-party SDK into an existing application
3. Handle file uploads with validation and error recovery
4. Test both success and failure paths

**Prerequisites**: Basic React/Next.js knowledge; Supabase account provisioned by facilitators.

---

## Session Flow (120 minutes)

### 1. Introduction and Context (10 minutes)

**Script**:
> "Today you'll connect StockLite to Supabase Storage for product photos. The database and auth are already working. Your task: implement the upload function in a prepared component starter, test it, and verify the photo displays after reload.
>
> This teaches you real integration skills: reading SDK documentation, handling asynchronous operations, validating inputs, and responding to service failures."

**Show**:
- The working application with photo upload already functional (demonstrator's complete version)
- The starter file students will complete (marked with TODOs)
- Supabase Storage dashboard

---

### 2. Concepts: Storage, SDKs, Access Control (20 minutes)

**Topics**:

**A. Supabase Storage architecture (5 minutes)**
- Buckets: namespaces for organizing files
- Object paths: `{bucket}/{owner}/{filename}`
- Public vs. private buckets
- Signed URLs for temporary access

**B. SDK integration pattern (7 minutes)**
- Import the client library
- Initialize with project URL and publishable key
- Call `storage.from('bucket').upload(path, file)`
- Handle promise resolution and errors

**C. Validation and security (5 minutes)**
- File type: check MIME type and extension
- File size: enforce limits before upload
- Path structure: prevent path traversal, use generated filenames
- Access control: bucket policies enforce ownership

**D. Error handling (3 minutes)**
- Upload success → save reference → display photo
- Upload fails → show error, offer retry, allow saving without photo
- Network issues, quota exceeded, permission denied

---

### 3. Live Demonstration (20 minutes)

**Demo**: Complete photo upload flow

1. **Show the starter code**: TODOs for validation, upload call, error handling
2. **Implement validation**:
   ```typescript
   if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
     setError('Only JPEG, PNG, and WebP images are allowed');
     return;
   }
   if (file.size > 2 * 1024 * 1024) {
     setError('File must be under 2 MB');
     return;
   }
   ```
3. **Implement upload**:
   ```typescript
   const filename = `${crypto.randomUUID()}.${ext}`;
   const path = `${userId}/${filename}`;
   const { error } = await supabase.storage
     .from('product-photos')
     .upload(path, file);
   ```
4. **Handle response**:
   - Success: save `path` to product record
   - Failure: display error, keep form usable
5. **Test**: Upload a photo, save product, reload, verify display

**Show diagnostics**: Network tab, storage bucket contents, database record

---

### 4. Planning and Setup (10 minutes)

**Activities**:
- Students open the starter file
- Review TODO sections together
- Confirm each student has test credentials and access to Supabase dashboard
- Distribute reference materials: SDK docs, validation requirements, expected function signatures

---

### 5. Integration Exercise (45 minutes)

**Task**: Complete the photo upload integration

**Instructions**:
> "Implement the three TODO sections in `app/components/ProductFormStarter.tsx`:
> 1. File validation (type and size)
> 2. Upload call to Supabase Storage
> 3. Error handling and retry logic
>
> Test your implementation: upload valid photos, oversized files, unsupported types. Verify photos display after reload."

**Facilitator roles**:
- **Support**: Help with SDK syntax, import errors, credential issues
- **Reviewer**: Spot-check implementations, ensure validation runs before upload
- **Lead**: Announce time remaining

**Expected completion**: Most students finish basic upload; advanced students implement retry and cleanup

---

### 6. Testing and Verification (10 minutes)

**Test scenarios**:
1. Upload valid JPEG → Save → Reload → Photo displays
2. Upload 5 MB file → Rejected with clear message
3. Upload .txt file → Rejected
4. Simulate storage failure (if teaching defect available) → Graceful error

Students capture evidence: screenshots of success and one failure scenario.

---

### 7. Submission (5 minutes)

**Deliverable checklist**:
- [ ] Completed starter file with working upload
- [ ] Screenshot of successful upload and display
- [ ] Screenshot of one validation or error scenario
- [ ] Brief reflection: "What was the hardest part?"

---

## Preparation Checklist

- [ ] Supabase Storage bucket `product-photos` created, private
- [ ] Bucket policies allow authenticated users to upload to their own path
- [ ] Starter file prepared with clear TODOs
- [ ] Test credentials distributed
- [ ] Sample test images provided (valid and invalid)

---

## Knowledge Check Questions

1. **What happens if you upload a 3 MB photo?**  
   **Answer**: Rejected by client-side validation before upload.

2. **Why use a generated filename instead of the original?**  
   **Answer**: Avoid collisions, prevent path traversal, consistent format.

3. **What is a signed URL?**  
   **Answer**: Temporary URL for accessing private storage objects without exposing credentials.

4. **If the upload succeeds but saving the product fails, is the photo lost?**  
   **Answer**: The photo is uploaded but not referenced. The app should attempt cleanup or allow retry.

5. **How does the bucket policy enforce ownership?**  
   **Answer**: RLS-style rules check that the path starts with the authenticated user's ID.

---

## Resources

- `docs/storage-integration.md` — Detailed setup and policy configuration
- Supabase Storage documentation (provided link)
- `teaching/storage-starter.tsx` — Student exercise template
