import { google } from "googleapis";

// Factory to create authenticated clients based on user's access token
export function getAuthenticatedClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

export async function fetchEmployees(auth: any, spreadsheetId: string) {
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "emp_details!A2:T1000",
  });
  
  const rows = response.data.values || [];
  return rows.map((row) => ({
    serialNumber: row[0],
    empCode: row[1],
    name: row[2],
    salaryType: row[3],
    department: row[4],
    designation: row[5],
    presentStatus: row[6],
    doj: row[7],
    basic: parseFloat(row[8]) || 0,
    hra: parseFloat(row[9]) || 0,
    conv: parseFloat(row[10]) || 0,
    grossSalary: parseFloat(row[11]) || 0,
    pf: parseFloat(row[12]) || 0,
    esi: parseFloat(row[13]) || 0,
    medi: parseFloat(row[14]) || 0,
    pl: parseFloat(row[15]) || 0,
    lta: parseFloat(row[16]) || 0,
    bonus: parseFloat(row[17]) || 0,
    gratuity: parseFloat(row[18]) || 0,
    ctcPerMonth: parseFloat(row[19]) || 0,
  }));
}

export async function duplicateAndFillTemplate(
  auth: any,
  templateId: string,
  destinationFolderId: string,
  employee: any,
  payableDays: number,
  monthName: string,
  year: string
) {
  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  // 1. Copy the template
  const newFileName = `Payslip_${employee.name}_${monthName}_${year}`;
  const copyRes = await drive.files.copy({
    fileId: templateId,
    requestBody: {
      name: newFileName,
      parents: [destinationFolderId],
    },
  });

  const newSpreadsheetId = copyRes.data.id!;

  // 2. Perform Mathematical Calculation for pro-rata salary
  // Assumption max days in month varies, using standard 31 or payableDays max
  const maxMonthDays = 31; // Usually calculated from month/year
  const ratio = (payableDays / maxMonthDays) || 0;

  let payBasic = 0, payHra = 0, payConv = 0, payGross = 0;
  let pf = 0, esi = 0, ptax = 130; // standard mockup deduction
  
  if (employee.salaryType === "REGULAR") {
    payBasic = Math.round(employee.basic * ratio);
    payHra = Math.round(employee.hra * ratio);
    payConv = Math.round(employee.conv * ratio);
    payGross = payBasic + payHra + payConv;
    pf = employee.pf; 
    esi = employee.esi;
  } else {
    // CONSOLIDATED
    payGross = Math.round(employee.grossSalary * ratio);
    // PF and ESI typically 0 for consolidated
  }
  
  const totalDeductions = pf + esi + ptax;
  const netPayable = payGross - totalDeductions;

  // 3. Prepare the exact Sheet payload mapped to the template
  const updates = [
    { range: "Sheet1!C7", values: [[employee.name]] },
    { range: "Sheet1!C9", values: [[employee.empCode]] },
    { range: "Sheet1!C11", values: [[employee.department]] },
    { range: "Sheet1!H7", values: [[employee.designation]] },
    { range: "Sheet1!H9", values: [[employee.doj]] },
    { range: "Sheet1!H11", values: [[payableDays]] },
    { range: "Sheet1!C14", values: [[employee.salaryType]] },
    
    // Earnings Column
    { range: "Sheet1!C20", values: [[payBasic]] },
    { range: "Sheet1!C22", values: [[payHra]] },
    { range: "Sheet1!C24", values: [[payConv]] },
    { range: "Sheet1!C34", values: [[payGross]] },

    // Deductions Column
    { range: "Sheet1!F20", values: [[ptax]] },
    { range: "Sheet1!F22", values: [[pf]] },
    { range: "Sheet1!F24", values: [[esi]] },
    { range: "Sheet1!F34", values: [[totalDeductions]] },

    // Final calculations
    { range: "Sheet1!D36", values: [[netPayable]] },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: newSpreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: updates,
    },
  });

  return newSpreadsheetId;
}

export async function exportSheetToPDF(auth: any, spreadsheetId: string) {
  const drive = google.drive({ version: "v3", auth });
  
  // Gets the PDF export of the file
  const response = await drive.files.export(
    { fileId: spreadsheetId, mimeType: "application/pdf" },
    { responseType: "arraybuffer" }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

export async function sendEmailWithPDF(
  auth: any,
  toEmail: string,
  subject: string,
  bodyText: string,
  pdfBuffer: Buffer,
  filename: string
) {
  const gmail = google.gmail({ version: "v1", auth });

  const boundary = "boundary_" + Math.random().toString(16).slice(2);
  const pdfBase64 = pdfBuffer.toString("base64");

  const emailLines = [
    `To: ${toEmail}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    bodyText,
    "",
    `--${boundary}`,
    `Content-Type: application/pdf; name="${filename}"`,
    `Content-Disposition: attachment; filename="${filename}"`,
    "Content-Transfer-Encoding: base64",
    "",
    pdfBase64,
    `--${boundary}--`,
  ];

  const rawMessage = Buffer.from(emailLines.join("\n")).toString("base64url");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: rawMessage,
    },
  });
}
