KAAMMILEGA — Partnership + Owner Verification Upgrade

FILES TO UPLOAD INTO THE ROOT OF YOUR GITHUB PAGES REPOSITORY:
  index.html         — existing site with Partnership button in the TOP white header
  partnership.html   — email-based form with all five proofs, private Supabase upload
  owner.html         — separate owner portal with full legacy management panels + verification queue

BACKEND (REQUIRED before uploading ID proofs):
  1. Open the SAME Supabase project already used for KaamMilega.
  2. SQL Editor -> paste and run partnership_setup.sql.
  3. Make sure the owner's existing Supabase Auth account is
     kaammilaga.official@gmail.com AND its email is verified.
  4. Verify the Storage bucket "partnership-proofs" is PRIVATE.
  5. Test with non-sensitive SAMPLE documents first and verify queue loads on owner.html.

WARNING:
 - Uploading HTML files alone is not enough for the submission system to work.
 - Do not publish a real applicant's Aadhaar/PAN scans to a public GitHub repo.
 - Mask the first eight digits of Aadhaar before upload.
 - Frontend validation alone cannot prevent forged documents; owner must verify and
   application approval needs written legal agreements and clear processing-fee terms.
 - Set up rate limits, malware scanning, retention/deletion, and CAPTCHA/abuse
   prevention before collecting real sensitive documents at scale.
 - Never put the Supabase service_role key in public HTML or GitHub.
 - Source owner panel preserved in owner.html; access still depends on Supabase
   Auth and SQL RLS, not whether the URL is publicly known.
