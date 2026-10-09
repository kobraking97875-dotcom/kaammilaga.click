KaamMilega — Professional public + member content update

Files:
- index.html: Updated existing KaamMilega page.

What changed:
- Public visitors can view the landing page, job search, informational sections and support content without a full-screen login overlay.
- The Google sign-in panel is now part of the page instead of blocking all content.
- After a valid Google sign-in, a personalized member workspace appears with shortcuts to Post a Job, Browse Jobs, Urgent Hiring, Profile, Worker Guide and Support.
- Existing page sections, form IDs, Supabase settings, Razorpay job-posting code and other existing handlers were retained.
- New inline JavaScript passed Node syntax checks.

Deployment:
1. Download and unzip this package.
2. In the GitHub repository used for GitHub Pages, replace the existing root index.html with this index.html.
3. Commit the change and wait for GitHub Pages to deploy.
4. Test the public page in a signed-out/private browser tab, then sign in with Google and test the member workspace.

Note: This is a front-end update. It does not change Supabase database policies, payment backend configuration, or guarantee that third-party services are configured correctly. Keep a backup of your current file before replacing it.
