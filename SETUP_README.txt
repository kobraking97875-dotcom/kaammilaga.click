KAAMMILEGA - SUPABASE EDGE FUNCTION UPDATE

IMPORTANT: The uploaded index(1).ts was the existing Razorpay job-posting function, NOT the partnership-review function. Both are included separately in this package. Do not replace both with one file without checking the function name.

1) PAYMENT / JOB FUNCTION:
   Supabase Dashboard > Edge Functions > razorpay-job-posting > Edit Code.
   Replace index.ts with: supabase/functions/razorpay-job-posting/index.ts
   Deploy the SAME function name: razorpay-job-posting.
   Preserve runtime secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET.

   Preserves existing functionality: action=trial, create_order, verify.
   Fixes a serious bug: action=verify no longer requires a job payload.
   Free trial does not need Razorpay secrets.
   Adds protected action=owner_delete_job, job_id=number or UUID.
   This action is authorized through the Supabase RPC km_is_partnership_owner and only runs
   with a verified Owner user JWT. The service-role key MUST remain server-side.
   Prices remain as in the uploaded code: one free trial, then INR 299 for 30-day job posts.
   Automatic refunds are NOT included when jobs are deleted/rejected.

2) OWNER WEBSITE:
   Replace owner.html in the GitHub Pages repository root with the enclosed owner.html.
   This makes the Owner Panel's job Delete / Reject & Delete buttons call the updated
   razorpay-job-posting Edge Function, rather than depending on browser-side DELETE grants.
   Keep existing index.html as-is.

3) PARTNERSHIP REVIEW AND EMAIL:
   Supabase Edge Functions > partnership-review: deploy the enclosed function code
   from supabase/functions/partnership-review/index.ts as a SEPARATE named function.
   Use the same name partnership-review; owner.html calls /functions/v1/partnership-review.
   Before using, run partnership_setup.sql (if not previously run), then
   partnership_tracking_upgrade.sql in SQL Editor.
   Set server-only secrets RESEND_API_KEY and RESEND_FROM_EMAIL (verified sender domain).
   Keep JWT verification enabled; the code independently checks logged-in Owner identity.
   Upload the enclosed partnership.html to GitHub Pages root (for applicant status tracking).

4) CHECK USING NON-SENSITIVE TEST DATA:
   a. Submit a sample partnership form and save Tracking ID.
   b. Track with ID + email; expect pending_verification.
   c. As Owner reject it -> proof cleanup and application deletion; track -> rejected.
   d. Submit a second sample; Owner approve -> email provider sends the 24-48 hour message.
   e. Post a sample job (free), then Owner Reject & Delete -> removal from database.
   f. Test paid checkout in Razorpay TEST MODE before accepting real payments.

5) SECURITY / NOTES:
   Never put service-role or Resend secrets into HTML/GitHub repository.
   The partnership form may contain sensitive identity proofs; use masked Aadhaar and
   obtain consent. Validate storage access, spam prevention and deletion policy before launch.
   Email delivery cannot be guaranteed until Resend and DNS verification are configured.
   Verify any live payment in Razorpay Dashboard and database before assuming success.

Files:
- supabase/functions/razorpay-job-posting/index.ts (updated uploaded file)
- supabase/functions/partnership-review/index.ts (previous review + email + cleanup backend)
- owner.html (owner frontend hooked to protected job delete)
- partnership.html (tracking UI)
- partnership_setup.sql and partnership_tracking_upgrade.sql
- original_index_backup.ts (your unchanged uploaded file)
