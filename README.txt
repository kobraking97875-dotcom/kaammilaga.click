KaamMilega Owner Panel + Partnership Edge Function: invalid application/action fix

Observed: The browser receives HTTP 400 Invalid application/action. The request reaches the backend; the owner application has NOT been confirmed deleted.

1. Supabase > Edge Functions > partnership-review > Code: REPLACE the deployed code with KaamMilega_partnership-review_FIXED.ts, then Deploy. Do not replace razorpay-job-posting.
2. In the GitHub repository root, upload KaamMilega_Owner_FIXED.html AS owner.html and commit it; wait for GitHub Pages deployment success. The Partnership page and index.html do not need updating.
3. Log in as the authorized Owner and refresh applications. Test only on a synthetic/test application first. A rejected application retry deletes its profile and associated identity proofs permanently; limited tracking status remains.
4. For real applications, carefully confirm proof paths are known and inspect Storage and Database afterward.
5. If error persists, Supabase > Edge Functions > partnership-review > Invocations / Logs: 400 INVALID_APPLICATION_ID means the client is sending a wrong/missing ID; INVALID_REVIEW_ACTION means a wrong action. 401 means auth JWT; 403 owner permission/origin; 409 wrong proof file path; 500/503 other errors. Do not share access tokens, Aadhaar/PAN contents or secret keys in screenshots.
6. Approval emails still require RESEND_API_KEY and RESEND_FROM_EMAIL; test separately.

This package changes only the partnership review function and owner.html. Other job, payment, and partnership-page code is retained. No live database delete or email request has been executed or verified here.
