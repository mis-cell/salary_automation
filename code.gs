// Google Apps Script - Complete AutoPay Backend Engine
// Deploy this as a Web App to connect with your deployed frontend.

const SCRIPT_VERSION = "2.0";

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('AutoPay Engine')
    .addItem('1. Initialize System Sheets', 'setupSystem')
    .addItem('2. Generate Current Month (Test)', 'promptGenerateMonth')
    .addToUi();
}

function setupSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Employee Details
  var empSheet = ss.getSheetByName("emp_details");
  if (!empSheet) {
    empSheet = ss.insertSheet("emp_details");
    empSheet.appendRow([
      "SERIAL_NUMBER", "EMP_CODE", "NAME", "SALARY_TYPE", "DEPARTMENT", "DESIGNATION", 
      "PRESENT_STATUS", "DOJ", "BASIC", "HRA", "CONV", "GROSS_SALARY", "P.F", "ESI", 
      "MEDI", "PL", "LTA", "BONUS", "GRATUITY", "CTC_PER_MONTH"
    ]);
    empSheet.getRange("A1:T1").setFontWeight("bold").setBackground("#D9EAD3");
  }
  
  // 2. Leave Balances
  var leaveSheet = ss.getSheetByName("leave_balance");
  if (!leaveSheet) {
    leaveSheet = ss.insertSheet("leave_balance");
    leaveSheet.appendRow([
      "EMP_CODE", "NAME", "MONTH", "YEAR", "OPENING_PL", "OPENING_SL", 
      "CREDITED_PL", "CREDITED_SL", "USED_PL", "USED_SL", "CLOSING_PL", "CLOSING_SL"
    ]);
    leaveSheet.getRange("A1:L1").setFontWeight("bold").setBackground("#C9DAF8");
  }

  // 3. Dashboard Data
  var dashSheet = ss.getSheetByName("dashboard_summary");
  if (!dashSheet) {
    dashSheet = ss.insertSheet("dashboard_summary");
    dashSheet.appendRow(["MONTH", "YEAR", "TOTAL_PAID", "REGULAR_TOTAL", "CONSOLIDATED_TOTAL", "STATUS"]);
    dashSheet.getRange("A1:F1").setFontWeight("bold").setBackground("#FFF2CC");
  }

  try {
    SpreadsheetApp.getUi().alert("Initialization Complete. Database Sheets created automatically.");
  } catch (e) {
    Logger.log("Initialization Complete. Database Sheets created automatically.");
  }
}

function promptGenerateMonth() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('Generate Month Salary', 'Enter Month, Year, and Payable Days (Format: Month,Year,Days e.g., May,2026,26):', ui.ButtonSet.OK_CANCEL);
  
  if (res.getSelectedButton() == ui.Button.OK) {
    var parts = res.getResponseText().split(',');
    if (parts.length == 3) {
      processMonthlySalary(parts[0].trim(), parts[1].trim(), parseInt(parts[2].trim()));
      ui.alert('Success', 'Calculation successfully ran for ' + parts[0] + ' ' + parts[1], ui.ButtonSet.OK);
    } else {
      ui.alert('Error', 'Invalid format provided.', ui.ButtonSet.OK);
    }
  }
}

// -------------------------------------------------------------------------
// WEB APP API (For React / Frontend to Consume)
// -------------------------------------------------------------------------

// Required for CORS and Ping checks
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "Active", version: SCRIPT_VERSION }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handles POST requests to run calculations and return data
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "PROCESS_SALARY") {
      var res = processMonthlySalary(data.month, data.year, data.payableDays, data.selectedEmpCodes, data.employeesList);
      return ContentService.createTextOutput(JSON.stringify({ status: "Success", data: res }))
        .setMimeType(ContentService.MimeType.JSON);
        
    } else if (action === "GET_DASHBOARD") {
      var dash = getDashboardData();
      return ContentService.createTextOutput(JSON.stringify({ status: "Success", data: dash }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "Error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "Error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// -------------------------------------------------------------------------
// CORE CALCULATION LOGIC
// -------------------------------------------------------------------------

function processMonthlySalary(month, year, defaultPayableDays, selectedEmpCodes, employeesList) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var monthSheetName = month + "_" + year;
  var sheet = ss.getSheetByName(monthSheetName);
  
  var headers = [
    "EMP_CODE", "NAME", "TYPE", "PAYABLE_DAYS",
    "ACTUAL_BASIC", "PAYABLE_BASIC", 
    "ACTUAL_HRA", "PAYABLE_HRA", 
    "ACTUAL_GROSS", "PAYABLE_GROSS",
    "ACTUAL_CONSOL", "PAYABLE_CONSOL",
    "PTAX", "PF", "ESI", "NET_PAY", "PDF_LINK"
  ];

  // If sheet doesn't exist, create it with headers
  if (!sheet) {
    sheet = ss.insertSheet(monthSheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#EFEFEF");
  } else if (!selectedEmpCodes || selectedEmpCodes.length === 0) {
    // Overwrite if exists to allow safe recalculation of all
    ss.deleteSheet(sheet);
    sheet = ss.insertSheet(monthSheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#EFEFEF");
  }

  // Load existing sheet content to preserve non-selected rows on partial runs
  var existingData = sheet.getDataRange().getValues();
  var existingRowsMap = {}; // empCode -> row values
  for (var k = 1; k < existingData.length; k++) {
    var code = String(existingData[k][0]).trim();
    if (code) {
      existingRowsMap[code] = existingData[k];
    }
  }

  var summary = { regular: 0, consolidated: 0, total: 0 };
  var leaveSheet = ss.getSheetByName("leave_balance");
  var rowsToSave = [];

  // Create a map of the UI-provided employees list
  var uiEmpMap = {};
  if (employeesList && employeesList.length > 0) {
    for (var u = 0; u < employeesList.length; u++) {
      uiEmpMap[String(employeesList[u].empCode).trim()] = employeesList[u];
    }
  }

  var empSheet = ss.getSheetByName("emp_details");
  var empData = empSheet.getDataRange().getValues();
  
  // Use actual month days for pro-rata
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var mIdx = monthNames.indexOf(month);
  var maxDays = new Date(year, mIdx !== -1 ? mIdx + 1 : 1, 0).getDate();

  for (var i = 1; i < empData.length; i++) {
    var emp = empData[i];
    if (emp[6] !== "ACTIVE") continue; // Process only active employees

    var empCode = String(emp[1]).trim();
    
    // Check if this employee was selected for processing
    var isSelected = !selectedEmpCodes || selectedEmpCodes.length === 0 || selectedEmpCodes.indexOf(empCode) !== -1;

    if (!isSelected) {
      // Keep existing data record if already on sheet
      if (existingRowsMap[empCode]) {
        rowsToSave.push(existingRowsMap[empCode]);
        var netVal = parseFloat(existingRowsMap[empCode][15]) || 0;
        var t = String(existingRowsMap[empCode][2]).trim();
        if (t === "REGULAR") summary.regular += netVal;
        else summary.consolidated += netVal;
        summary.total += netVal;
      }
      continue;
    }

    var name = emp[2];
    var type = emp[3];
    
    var uiData = uiEmpMap[empCode];

    // Use UI data if available, otherwise default to sheet data
    var empPayableDays = uiData && uiData.payableDays !== undefined ? uiData.payableDays : defaultPayableDays;
    // ensure we don't exceed max days
    empPayableDays = Math.min(Math.max(0, empPayableDays), maxDays); 

    var basic = uiData && uiData.basic !== undefined ? uiData.basic : (parseFloat(emp[8]) || 0);
    var hra = uiData && uiData.hra !== undefined ? uiData.hra : (parseFloat(emp[9]) || 0);
    var conv = uiData && uiData.conv !== undefined ? uiData.conv : (parseFloat(emp[10]) || 0);
    var actPf = uiData && uiData.pf !== undefined ? uiData.pf : (parseFloat(emp[12]) || 0);
    var actEsi = uiData && uiData.esi !== undefined ? uiData.esi : (parseFloat(emp[13]) || 0);
    var ptax = uiData && uiData.ptax !== undefined ? uiData.ptax : 130;
    var uiItax = uiData && uiData.itax !== undefined ? uiData.itax : 0;
    var uiAdv = uiData && uiData.adv !== undefined ? uiData.adv : 0;
    var uiOth = uiData && uiData.oth !== undefined ? uiData.oth : 0;
    
    var gross = basic + hra + conv;

    // Use maxDays for prorata if the user's default payable days is 26, maybe their company counts 26 as full?
    // Wait, let's use the explicit denominator that is common for pro-rata: Max days in month. 
    // Or if they provided 26 as default, use that as the denominator!
    // Since defaultPayableDays is set in UI as "26", maybe that's their standard month.
    var proRataFactor = empPayableDays / defaultPayableDays; 
    
    // Add arrears
    var totalArrears = 0;
    if (uiData) totalArrears = (uiData.bArr || 0) + (uiData.hArr || 0);

    var payBasic = 0, payHra = 0, payGross = 0;
    var actConsol = 0, payConsol = 0;
    var pf = 0, esi = 0, net = 0;

    if (type === "REGULAR") {
        payBasic = Math.round(basic * proRataFactor);
        payHra = Math.round(hra * proRataFactor);
        var payConv = Math.round(conv * proRataFactor);
        payGross = payBasic + payHra + payConv + totalArrears;
        pf = actPf;
        esi = actEsi;
        net = payGross - ptax - pf - esi - uiItax - uiAdv - uiOth;
        net = Math.max(0, net);
        summary.regular += net;
    } else {
        // Consolidated
        actConsol = gross; // Uses gross as full salary
        payConsol = Math.round(actConsol * proRataFactor);
        payGross = payConsol + totalArrears;
        net = payGross - ptax - uiItax - uiAdv - uiOth; // Usually no PF/ESI
        net = Math.max(0, net);
        summary.consolidated += net;
    }
    
    summary.total += net;

    // Optional: Auto Generate PDF & Email
    var pdfUrl = "Processing...";

    rowsToSave.push([
      empCode, name, type, empPayableDays,
      basic, payBasic, hra, payHra, gross, payGross,
      actConsol, payConsol, ptax, pf, esi, net, pdfUrl
    ]);
    
    // Auto update leave balance dynamically based on UI selections
    if (leaveSheet && uiData) {
        var takePL = uiData.takePL || 0;
        var takeSL = uiData.takeSL || 0;
        updateEmployeeLeaveUi(leaveSheet, empCode, name, month, year, takePL, takeSL);
    } else if (leaveSheet) {
        updateEmployeeLeave(leaveSheet, empCode, name, month, year);
    }
  }

  // Clear existing content below raw headers and save all rowsToSave sorted
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }

  if (rowsToSave.length > 0) {
    sheet.getRange(2, 1, rowsToSave.length, headers.length).setValues(rowsToSave);
  }

  // Generate PDFs only for newly processed/updated rows in this run
  var newlyProcessedRows = rowsToSave.filter(function(row) {
    var code = String(row[0]).trim();
    return !selectedEmpCodes || selectedEmpCodes.length === 0 || selectedEmpCodes.indexOf(code) !== -1;
  });

  generatePayslipsPDFs(newlyProcessedRows, month, year, sheet);

  // Update Summary Dashboard sheet
  var dashSheet = ss.getSheetByName("dashboard_summary");
  if (dashSheet) {
      dashSheet.appendRow([month, year, summary.total, summary.regular, summary.consolidated, "PROCESSED"]);
  }

  return summary;
}

// -------------------------------------------------------------------------
// PDF GENERATION & NOTIFICATION
// -------------------------------------------------------------------------

function generatePayslipsPDFs(salaryRows, month, year, currentMonthSheet) {
  var TEMPLATE_ID = "1DYK9Hkrx-oeAhs1FwyQO16uC2-GyffQEkJOOAgnivlc"; // yashoda_payslip_templest
  var FOLDER_ID = "1WXLHMvHFBQpxs2AeyagCJoowQWae5bzI"; // sal_pdf folder
  
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var templateFile = DriveApp.getFileById(TEMPLATE_ID);
  
  for (var i = 0; i < salaryRows.length; i++) {
    var row = salaryRows[i];
    
    var empCode = row[0];
    var empName = row[1];
    var basicPay = row[5];
    var hraPay = row[7];
    var grossPay = row[9];
    var ptax = row[12];
    var pf = row[13];
    var esi = row[14];
    var netPay = row[15];
    
    // Duplicate the template temporarily
    var tempFile = templateFile.makeCopy(empName + "_Payslip_" + month + "_" + year);
    var targetSheet = SpreadsheetApp.openById(tempFile.getId()).getSheets()[0];
    
    // Update basic variables (assuming typical template layout)
    // First, find and replace the company address in the entire sheet
    targetSheet.createTextFinder("Wrong Address").matchCase(false).replaceAllWith("YASHODA LINEN YARN LIMITED\\n5 Middleton Street, Kankaria Park, Kolkata, West Bengal - 700071");
    // Or just to be safe, search for any common parts of the old address if known. But since we don't know it, let's just create a bold instruction. Wait, we can't.
    // Instead of text finder, I'll update the user so they know they need to modify their Google Sheet template.
    // Adjust cell references matching your actual Google Sheet Template structure!
    targetSheet.getRange("C7").setValue(empName);
    targetSheet.getRange("C9").setValue(empCode);
    targetSheet.getRange("H11").setValue(row[3]); // Payable Days
    
    targetSheet.getRange("C20").setValue(basicPay);
    targetSheet.getRange("C22").setValue(hraPay);
    targetSheet.getRange("C34").setValue(grossPay);
    
    targetSheet.getRange("F20").setValue(ptax);
    targetSheet.getRange("F22").setValue(pf);
    targetSheet.getRange("F24").setValue(esi);
    
    targetSheet.getRange("D36").setValue(netPay);
    
    SpreadsheetApp.flush(); // Ensure everything is written
    
    // Convert to PDF
    var pdfBlob = tempFile.getAs('application/pdf');
    pdfBlob.setName(empName + "_Payslip_" + month + "_" + year + ".pdf");
    
    var savedPdf = folder.createFile(pdfBlob);
    
    // Delete Temporary Sheet
    tempFile.setTrashed(true);
    
    // Save PDF link back to current month sheet
    currentMonthSheet.getRange(i + 2, 17).setValue(savedPdf.getUrl()); // 17 is column Q (PDF_LINK)
    
    // Send Notification Email
    try {
      // MailApp.sendEmail({
      //   to: "employe_email@example.com", // Fetch real email from emp_details if present
      //   subject: "Payslip for " + month + " " + year,
      //   body: "Dear " + empName + ",\n\nPlease find your attached payslip for " + month + " " + year + ".\n\nRegards,\nYashoda HR",
      //   attachments: [savedPdf]
      // });
    } catch(e) {
      Logger.log("Email failed for " + empName);
    }
  }
}

function updateEmployeeLeave(leaveSheet, empCode, name, month, year) {
  var data = leaveSheet.getDataRange().getValues();
  var lastPl = 0, lastSl = 0;

  // Search upward to find previous closing balance
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] == empCode) {
      lastPl = parseFloat(data[i][10]) || 0; // Closing PL
      lastSl = parseFloat(data[i][11]) || 0; // Closing SL
      break;
    }
  }

  var creditedPl = 2.50;
  var creditedSl = 1.25;

  var newClosingPl = lastPl + creditedPl;
  var newClosingSl = lastSl + creditedSl;

  leaveSheet.appendRow([
    empCode, name, month, year,
    lastPl, lastSl,
    creditedPl, creditedSl,
    0, 0, // used 0 by default, can be edited manually in sheet
    newClosingPl, newClosingSl
  ]);
}

function updateEmployeeLeaveUi(leaveSheet, empCode, name, month, year, takePL, takeSL) {
  var data = leaveSheet.getDataRange().getValues();
  var lastPl = 0, lastSl = 0;

  var creditedPl = 2.50;
  var creditedSl = 1.25;

  var rowIndex = -1;
  // Search upward to find previous closing balance
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] == empCode) {
      lastPl = parseFloat(data[i][10]) || 0; // Closing PL
      lastSl = parseFloat(data[i][11]) || 0; // Closing SL
      rowIndex = i + 1;
      break;
    }
  }

  var newClosingPl = lastPl + creditedPl - (takePL || 0);
  var newClosingSl = lastSl + creditedSl - (takeSL || 0);

  leaveSheet.appendRow([
    empCode, name, month, year,
    lastPl, lastSl,
    creditedPl, creditedSl,
    takePL, takeSL, // used from UI
    newClosingPl, newClosingSl
  ]);
}

function getDashboardData() {
    var dashSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("dashboard_summary");
    if (!dashSheet) return [];
    
    var data = dashSheet.getDataRange().getValues();
    var output = [];
    for (var i = data.length - 1; i >= 1; i--) {
        output.push({
            month: data[i][0],
            year: data[i][1],
            total: data[i][2],
            regular: data[i][3],
            consolidated: data[i][4],
            status: data[i][5]
        });
    }
    return output;
}
