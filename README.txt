KaamMilega — Full-width Hiring Desk + Live Promo Banner

What changed:
- Expanded the Hiring Desk / Post Your Job Requirement card to the full available width in the marked area.
- Kept the existing page content, features, and live promotional banner from the previous package.
- Responsive layout: two columns for fields on wide screens, one column on narrow screens.

Deployment:
1. Keep a backup of the currently deployed index.html.
2. Replace the site's root index.html with this index.html and deploy/publish it.
3. If you use the live banner counter, run banner-counter-setup.sql once in Supabase SQL Editor (only if you have not already run it).

Important: The separate error “Could not find the function public.publish_free_trial_job(p_job) in the schema cache” is a Supabase database/API function error, not a layout issue. This ZIP expands the marked section but does not change your job-posting backend. That error needs the matching SQL function or the frontend must be pointed to the existing Razorpay Edge Function.
