KAAMMILEGA — SAFE PARTNERSHIP UUID CONNECTION DIAGNOSIS

These two files are a matched version. This package adds a READ-ONLY 'Check Connection' button to each partnership application.

Why: Current deployed function returns INVALID_APPLICATION_ID, but locally supplied owner code already validates UUID and posts {id, action}. The exact discrepancy cannot be proven from a screenshot alone. This diagnostic identifies which fields the function actually receives without deleting any application.

1. Back up the current owner.html and partnership-review Edge Function code.
2. Supabase > Edge Functions > partnership-review > Code: replace code with partnership-review-diagnostic.ts and DEPLOY UPDATES.
3. GitHub repository root: upload the included owner.html, replacing existing owner.html. Wait for Pages deployment success, then open owner.html in Incognito (not a cached installed shortcut).
4. Sign in as authorized owner, press 'Refresh Applications', then 'Check Connection' on a TEST partnership application (not Approve or Reject).
5. If successful, it says Connection OK. If failed, error now includes safe diagnostic: key names, UUID length, function version, and trace identifier. Send ONLY that error text or a screenshot with applicants' names, emails, and document links hidden. Never share JWT, Service Role keys, Aadhaar/PAN or document images.
6. Supabase > partnership-review > Invocations/Logs can confirm the diagnostic trace. Do not run actual Reject & Remove or Retry Proof Cleanup until the connection test is successful and storage deletion is separately verified.

Note: This test does not change job-posting, payments, application status, or applicant files. Live Supabase functionality cannot be tested from the local environment.
