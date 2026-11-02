KAAMMILEGA PLATINUM CAREER PAGES — MOBILE DEPLOY

CAUSE:
Your screenshot displayed raw HTML without styling. The previous files relied on:
  career-assets/career.css
  career-assets/career.js
If this folder wasn't uploaded or doesn't match case, pages show raw text,
and "Loading..." never finishes.

THIS FIX:
All 22 career HTML files now contain embedded CSS + JavaScript.
No career-assets folder is required for these pages.
Appearance: dark navy / platinum silver / icy blue premium design.
Responsive navigation, card layout, readable forms and PDF preview.
Existing forms, job queries, Supabase auth, applications and alerts JavaScript preserved.
Automatic email still requires Supabase Edge Function + Resend + scheduler.
A working job listing still requires Supabase tables, RLS and network access.

UPLOAD INSTRUCTIONS (MOBILE):
1. Download and EXTRACT KaamMilega_Platinum_Standalone_Pages.zip
2. Open https://github.com/kobraking97875-dotcom/kaammilaga.click
3. Choose Add file > Upload files.
4. Upload the HTML files and career-sitemap.xml from the extracted folder to repository ROOT.
5. GitHub may warn the same file already exists; replace/commit those HTML files.
6. IMPORTANT: Do NOT remove or replace existing index.html, owner.html,
   partnership.html, your ads, logos, etc.
7. Check GitHub Actions Pages deployment success.
8. Open https://kaammilaga.click/career-guides.html?platinum=1
   and https://kaammilaga.click/resume.html?platinum=1
9. Refresh in an incognito tab if cache persists.

TESTING:
CSS and JavaScript were embedded in each file to remove asset-path dependency.
Code syntax / HTML integrity and local Chromium layout were checked.
Live backend / ad delivery are not verified by this package.

For private job application status: deploy SQL separately.
