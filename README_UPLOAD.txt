KaamMilega: Career pages mein TWO display ads (Homepage par nahi)

Aapke screenshot ke 8 buttons (Salary Calculator ko chhodkar) jin naye
pages par jaate hain, un pages ke CONTENT ke andar Advertisement 1 aur
Advertisement 2 rakh diye gaye hain. 8 city pages, career articles,
job detail, career updates par bhi 2 ad placements hain.

Yeh update MAIN index.html ko bilkul nahi badalta.
Owner-only applications-owner.html ko bhi change nahi kiya hai.

KYA CHANGE HUA:
- Pichhle version mein ad frames FOOTER KE BAAD the. Ab <main> ke andar,
  page content ke neeche aur FOOTER KE PEHLE hain.
- Purana footer-after ad block hata diya hai. 2 alag banner cards hain:
  300 x 250 aur 160 x 300, dono mobile-friendly.
- CSS/JS har HTML ke andar hi hai, career-assets folder ki zaroorat nahi.
- Cross-origin iframe use hua hai, third-party ads main website ke
  application/login forms ke JavaScript origin se isolate rehte hain.

UPLOAD:
1. ZIP extract karein. Isme 20 .html files hain.
2. Main GitHub repo kholo:
   https://github.com/kobraking97875-dotcom/kaammilaga.click
3. Root mein same-name 20 Career HTML files replace karke Commit karo.
4. index.html, owner.html, partnership.html, and Ads files mat badlo.
5. Ads hosting repo mein yeh files accessible honi chahiye:
   https://kobraking97875-dotcom.github.io/kaammilaga-ads/km-ad-300.html
   https://kobraking97875-dotcom.github.io/kaammilaga-ads/km-ad-160x300.html
   Agar 160x300 wala 404 dikhaye, AdsHost ZIP ki km-ad-160x300.html
   file nayi Ads repository mein upload karni hogi.
6. Deploy green ho, phir chrome Incognito mein kholo:
   https://kaammilaga.click/jobs.html?fix=2
   https://kaammilaga.click/career-guides.html?fix=2
   https://kaammilaga.click/alerts.html?fix=2
7. Page content ke niche, footer ke upar, Advertisement 1/2 dikhenge.

Ad network ke actual creative/impressions ki guarantee nahi hai.
Active ad units, network fill, browser blocking aur embeds pe depend karta hai.

Privacy: Ad banners are NEVER mandatory for job seeking/applications.
Automatic email alerts still require Resend+Edge Function+scheduler.
