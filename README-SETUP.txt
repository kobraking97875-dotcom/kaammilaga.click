KAAMMILEGA — RAZORPAY JOB POSTING
================================

Included
--------
- index.html: website with Google login gate and job-posting checkout flow.
- supabase/migrations/202610100001_job_posting_razorpay.sql: database tables, one-free-post tracking, payment records, 30-day expiry and direct-insert guard.
- supabase/functions/razorpay-job-posting/index.ts: server-side Razorpay order creation and payment verification.

PRICING BEHAVIOUR
-----------------
1. A registered employer gets one free job post.
2. Existing employers who already have a job record are marked as having used the free post by the migration.
3. Every later job post requires a ₹299 Razorpay payment.
4. The paid post is submitted for owner review only after the server verifies the Razorpay signature and payment with Razorpay's API.
5. The 30-day listing period starts when the owner activates/approves the post.
6. This is a one-time checkout per paid job post. It does not silently charge or auto-debit a card/bank account.
7. Payment does not guarantee employment, applications or selection.

DEPLOY STEPS
------------
1. Back up the current site and database before changing production.
2. In Supabase SQL Editor, run the complete migration file at:
   supabase/migrations/202610100001_job_posting_razorpay.sql
3. In Supabase Dashboard > Edge Functions, create/deploy function named:
   razorpay-job-posting
   Use the source in supabase/functions/razorpay-job-posting/index.ts.
4. Set these Edge Function secrets in Supabase:
   RAZORPAY_KEY_ID       = your Razorpay Key ID
   RAZORPAY_KEY_SECRET   = your Razorpay Key Secret
   SUPABASE_URL          = your Supabase project URL (usually already provided)
   SUPABASE_ANON_KEY     = your Supabase anon/publishable key
   SUPABASE_SERVICE_ROLE_KEY = your Supabase service-role key
5. Keep the Razorpay secret and Supabase service-role key ONLY in server-side secrets. Never put them in index.html or GitHub.
6. In Razorpay, use test keys first. Complete a successful test payment and a failed/cancelled payment before switching to live keys.
7. Upload index.html to the site's existing hosting root. Do not replace the Supabase project or delete other website assets.
8. Verify that Google sign-in is enabled and its redirect URL includes the live site URL in Supabase Authentication settings.

IMPORTANT NOTES
---------------
- This package does not deploy itself or configure your live Supabase project; the SQL migration and Edge Function must be deployed there.
- The database guard blocks direct job inserts that bypass the verified trial/payment flow. If another trusted workflow inserts jobs, it must be deliberately updated to use the authorized server flow.
- Do not claim that 100% employment is guaranteed. Hiring decisions are made by employers and depend on genuine vacancies and selection.
