/**
 * Broken Knuckles Auto Repair — booking form receiver
 * ---------------------------------------------------
 * Paste this into Extensions → Apps Script inside your Google Sheet,
 * then Deploy → New deployment → Web app:
 *     Execute as:      Me
 *     Who has access:  Anyone
 * Copy the /exec URL it gives you into GOOGLE_SHEET_ENDPOINT in main.js.
 *
 * Every submission is appended as a row and emailed to NOTIFY_EMAIL.
 */

const SHEET_NAME   = "Requests";
const NOTIFY_EMAIL = "";   // <-- put your email here to get an alert per request. Leave "" for none.

const HEADERS = [
  "Submitted",
  "Name",
  "Phone",
  "Vehicle",
  "Service Type",
  "Preferred Day",
  "Preferred Time",
  "Issue",
  "Source"
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Honeypot — bots fill the hidden "company" field. Accept, log nothing.
    if (data.company) {
      return json({ result: "ok" });
    }

    const sheet = getSheet_();

    sheet.appendRow([
      data.submittedAt || new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
      data.name || "",
      data.phone || "",
      data.vehicle || "",
      data.serviceType || "",
      data.preferredDate || "",
      data.preferredTime || "",
      data.issue || "",
      data.source || ""
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: "New service request — " + (data.name || "no name"),
        body: [
          "Name:          " + (data.name || ""),
          "Phone:         " + (data.phone || ""),
          "Vehicle:       " + (data.vehicle || ""),
          "Service type:  " + (data.serviceType || ""),
          "Preferred day: " + (data.preferredDate || "any"),
          "Preferred time:" + (data.preferredTime || "any"),
          "",
          "Issue:",
          data.issue || "",
          "",
          "— sent from brokenknuckles website"
        ].join("\n")
      });
    }

    return json({ result: "ok" });
  } catch (err) {
    return json({ result: "error", message: String(err) });
  }
}

/** Lets you open the /exec URL in a browser to confirm the deployment is live. */
function doGet() {
  return json({ result: "ok", message: "Broken Knuckles booking endpoint is live." });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
