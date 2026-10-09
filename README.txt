KaamMilega Live Dashboard (login-only)

1. Back up the current GitHub Pages index.html.
2. Replace the repository root index.html with the index.html in this ZIP.
3. Commit changes and wait for GitHub Pages to deploy.
4. Test in a normal browser tab: logged out, the dashboard section between Worker & Employer Reviews and About KaamMilega must be hidden. After Google login, it appears there. Log out and it hides again.

The dashboard is HTML/CSS/JavaScript, not a static screenshot. It fetches active jobs and recent listings from the configured Supabase REST API. If the API permissions/schema prevent loading, it shows an honest unavailable message instead of fake statistics. Existing sign-in flow and existing job/payment handlers are retained from the source file.
