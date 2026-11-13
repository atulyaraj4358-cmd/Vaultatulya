# 🔒 A Vault: file & app vault

Static site + PHP 7.4+ backend. No libraries. Data lives in `data.json`.

## Files
index.html · style.css · script.js · games.js · phone.js · api.php · admin.php · data.json · manifest.json · sw.js · .htaccess · README.md

## Hosting on InfinityFree
1. Create a hosting account, open **File Manager** (or FTP) and go to `htdocs`.
2. Upload **all** files from this folder into `htdocs` (keep `.htaccess`; enable "show hidden files").
3. Set `data.json` permission to **664** (644 for the other files). If saving fails, try 666.
4. Open `admin.php` and change `ADMIN_PASS` and `SECRET_KEY` (long random text).
5. Visit `https://yoursite/api.php?action=list`. You should see JSON. If you see an HTML page, open the site once in a normal browser tab, then retry.
6. Turn on free SSL/HTTPS (needed for the PWA and camera features), optionally add your own domain.
7. Back up `data.json` regularly: it holds every file, app, count and score.

## Hosting on cPanel
Upload to `public_html`, same permissions (data.json 664), edit `admin.php`, force HTTPS from the SSL/TLS panel.

## Admin
Log 

## Testing checklist
1. Open the site on phone A and phone B (not logged in on B).
2. On A: log in as admin, tap "+ Add File", publish.
3. B should show "🆕 New file added" within about 5 seconds, with no refresh.
4. On A: delete that file. It should disappear from B within about 5 seconds.
5. Download a file: counter goes up on both phones.
6. Open 🎮 Games and 📱 Phone: add an app on A; B's phone shows a Dynamic Island notice and a badge on Vault Store.
7. Switch ✨ Effects to Off and check everything still works.
