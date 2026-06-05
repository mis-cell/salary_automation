function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { action, month, year, data } = payload;
    
    if (action !== "PROCESS_SALARY") {
      return ContentService.createTextOutput(JSON.stringify({ status: "Success", message: "Ignored." })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- CONFIGURATION ---
    // 1. ADD YOUR TEMPLATE SPREADSHEET ID HERE
    const TEMPLATE_SHEET_ID = 'YOUR_TEMPLATE_SPREADSHEET_ID'; 
    // 2. ADD THE FOLDER ID WHERE PDFS SHOULD BE SAVED
    const OUTPUT_FOLDER_ID = 'YOUR_OUTPUT_FOLDER_ID'; 
    
    const ss = SpreadsheetApp.openById(TEMPLATE_SHEET_ID);
    const templateSheet = ss.getSheetByName("yashoda_payslip"); // Ensure this matches exactly
    const folder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);
    
    const results = [];
    
    data.forEach(emp => {
      // Create a temporary sheet for this employee
      const newSheet = templateSheet.copyTo(ss);
      newSheet.setName(`Temp_${emp.id}_${new Date().getTime()}`);
      
      // Calculate derived values
      const grossPay = (emp.basic || 0) + (emp.hra || 0) + (emp.convey || 0) + (emp.basicArr || 0) + (emp.hraArr || 0) + (emp.conveyArr || 0);
      const totalDed = (emp.pTax || 0) + (emp.pf || 0) + (emp.esi || 0) + (emp.adv || 0) + (emp.iTax || 0) + (emp.others || 0);
      const netPay = grossPay - totalDed;
      
      // Map tags to actual data exactly as they are in the sheet
      const replacements = {
        "<<Month>>": month,
        "<<Year>>": year,
        "<<Employee Name>>": emp.name,
        "<<Designation>>": emp.desig,
        "<<Emp ID>>": emp.id,
        "<<DOJ>>": emp.doj,
        "<<Department>>": emp.dept,
        "<<Payable days>>": emp.payableDays,
        
        "<<Availed PL>>": emp.usedPL || 0,
        "<<Used PL>>": emp.usedPL || 0,
        "<<PL Balance>>": emp.plBal || 0,
        "<<Earned PL>>": 2.5,
        
        "<<Availed SL>>": emp.usedSL || 0,
        "<<Used SL>>": emp.usedSL || 0,
        "<<SL Balance>>": emp.slBal || 0,
        "<<Earned SL>>": 1.25,
        
        "<<Basic>>": emp.basic || 0,
        "<<H R A>>": emp.hra || 0,
        "<<Convey.>>": emp.convey || 0,
        "<<Basic Arrear>>": emp.basicArr || 0,
        "<<HRA Arrear>>": emp.hraArr || 0,
        "<<Convey. Arrear>>": emp.conveyArr || 0,
        
        "<<P Tax>>": emp.pTax || 0,
        "<<P.F>>": emp.pf || 0,
        "<<ESI>>": emp.esi || 0,
        "<<Adv.>>": emp.adv || 0,
        "<<I. Tax>>": emp.iTax || 0,
        "<<Others>>": emp.others || 0,
        
        "<<Total Deduction>>": totalDed,
        "<<Gross Pay>>": grossPay,
        "<<Total Net Payable>>": netPay,
        "<<Amount In Words>>": numberToWords(netPay) + " Only"
      };
      
      let dataRange = newSheet.getDataRange();
      let values = dataRange.getValues();
      
      for (let r = 0; r < values.length; r++) {
        for (let c = 0; c < values[r].length; c++) {
          let cellValue = values[r][c];
          if (typeof cellValue === 'string') {
            for (let key in replacements) {
              if (cellValue.includes(key)) {
                cellValue = cellValue.replace(key, replacements[key]);
              }
            }
            values[r][c] = cellValue;
          }
        }
      }
      dataRange.setValues(values);
      SpreadsheetApp.flush();
      
      // Export to PDF
      const p = ss.getId();
      const s = newSheet.getSheetId();
      const url = `https://docs.google.com/spreadsheets/d/${p}/export?format=pdf&gid=${s}`;
      
      const token = ScriptApp.getOAuthToken();
      const response = UrlFetchApp.fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      const blob = response.getBlob().setName(`Payslip_${emp.name}_${month}_${year}.pdf`);
      folder.createFile(blob);
      
      // Cleanup temporary sheet
      ss.deleteSheet(newSheet);
      
      results.push({ emp: emp.name, status: "Success" });
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "Success", data: results })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "Error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Number to Words Converter
function numberToWords(num) {
    var a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    var b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; var str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() ? "Rupees " + str.trim() : "";
}
