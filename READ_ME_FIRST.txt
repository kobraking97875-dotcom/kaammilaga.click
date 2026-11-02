KaamMilega Ads Display Fix (separate origin, protected applicant form)

WHY: Ads worked in ads-check.html but were blank inside partnership.html.
The old iframe sandbox did not include allow-same-origin; some ad
scripts need a usable origin to load. Removing sandbox on the same
site would expose Aadhaar/PAN form information to untrusted scripts.

SETUP

A) Create a NEW PUBLIC GitHub repository under:
   Account: kobraking97875-dotcom
   Repository name: kaammilaga-ads

B) Upload the FOUR files from Separate-Ads-Repo to the NEW
   repo root (NOT the main website repo):
   index.html
   km-ad-728.html
   km-ad-300.html
   km-ad-160.html

C) New repo > Settings > Pages > Build and deployment
   Source: Deploy from a branch
   Branch: main / (root) > Save
   Do NOT add the kaammilaga.click custom domain or a CNAME.

D) Test (after GitHub Pages turns green):
   https://kobraking97875-dotcom.github.io/kaammilaga-ads/
   https://kobraking97875-dotcom.github.io/kaammilaga-ads/km-ad-300.html

E) ONLY after D is working: In EXISTING kaammilaga.click
   repo, replace partnership.html with the file in
   Main-Website/partnership.html, Commit and deploy.
   Do NOT touch index.html, owner.html, Supabase SQL, or forms.

F) Reopen https://kaammilaga.click/partnership.html
   in a private tab. Most relevant for mobile: 300x250 placement.
   The 728x90 banner is intentionally hidden below 760px width.

LIMITATIONS
 - May still be blocked by ad network, browser or ad policies.
 - Never test revenue by repeatedly clicking your own ads.
 - Do not place ad HTML in the same-origin domain as the KYC form.
 - If ads work on the new ad host but not embedded, the provider
   may disallow iframe embedding; check its support instructions.
