const SPREADSHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Products";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) sh = ss.insertSheet(SHEET_NAME);

    if (sh.getLastRow() === 0) {
      sh.appendRow(["تاریخ", "دسته", "رتبه", "محصول", "امتیاز", "قیمت", "لینک"]);
    }

    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    const values = rows.map(r => [
      today,
      r.category || "",
      r.rank || "",
      r.name || "",
      r.rating || "",
      r.price || "",
      r.url || ""
    ]);

    if (values.length) {
      sh.getRange(sh.getLastRow()+1, 1, values.length, values[0].length).setValues(values);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ok:true, inserted:values.length}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok:false, error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function testSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  sh.getRange("A1").setValue("اتصال آماده است ✅");
}
