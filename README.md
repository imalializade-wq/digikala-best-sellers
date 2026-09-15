# Digikala daily best sellers → Google Sheets

This project opens Digikala's Best Selling page in Chromium, clicks the category tabs, collects product links/text, and POSTs the results to a Google Apps Script web app.

## Setup

1. In the Google Sheet, open Extensions → Apps Script.
2. Replace the script with `apps_script.gs`.
3. Replace `SPREADSHEET_ID` with your Sheet ID.
4. Deploy → New deployment → Web app.
5. Execute as: Me. Who has access: Anyone.
6. Copy the Web app URL.
7. On GitHub, create a new repository and upload these files.
8. Repository → Settings → Secrets and variables → Actions → New repository secret.
   Name: `SHEET_WEBHOOK_URL`
   Value: your Web app URL.
9. Actions → Digikala daily best sellers → Run workflow to test.
10. The workflow is scheduled daily.

The scraper is intentionally conservative: it reads what the Best Selling page exposes and does not attempt to bypass login, CAPTCHA, or access controls.
