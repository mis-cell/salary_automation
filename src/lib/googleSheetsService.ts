import { isOfflineMode, dbGetEmployees, dbSaveEmployees, dbGetLeaves, dbGetDashboardSummary, dbGetMonthlyPayroll } from "./localDatabase";

export interface EmployeeRow {
  serialNumber: string;
  empCode: string;
  name: string;
  salaryType: string;
  department: string;
  designation: string;
  presentStatus: string;
  doj: string;
  basic: number;
  hra: number;
  conv: number;
  grossSalary: number;
  pf: number;
  esi: number;
  medi: number;
  pl: number;
  lta: number;
  bonus: number;
  gratuity: number;
  ctcPerMonth: number;
}

export interface LeaveBalanceRow {
  empCode: string;
  name: string;
  month: string;
  year: string;
  openingPL: number;
  openingSL: number;
  creditedPL: number;
  creditedSL: number;
  usedPL: number;
  usedSL: number;
  closingPL: number;
  closingSL: number;
}

export interface DashboardSummaryRow {
  month: string;
  year: string;
  totalPaid: number;
  regularTotal: number;
  consolidatedTotal: number;
  status: string;
}

export interface ServiceLogEntry {
  timestamp: string;
  type: "INFO" | "SUCCESS" | "ERROR";
  action: string;
  details: string;
}

// Persistent memory-based queue for debugging
let serviceLogs: ServiceLogEntry[] = [];

// Try to initialize from localStorage to keep logs across reloads
try {
  const saved = localStorage.getItem("YASHODA_SERVICE_AUDIT_LOGS");
  if (saved) {
    serviceLogs = JSON.parse(saved);
  }
} catch (e) {
  // Ignored
}

export function getServiceLogs(): ServiceLogEntry[] {
  return serviceLogs;
}

export function clearServiceLogs() {
  serviceLogs = [];
  try {
    localStorage.removeItem("YASHODA_SERVICE_AUDIT_LOGS");
  } catch (e) {}
}

export function addServiceLog(type: "INFO" | "SUCCESS" | "ERROR", action: string, details: string) {
  const entry: ServiceLogEntry = {
    timestamp: new Date().toLocaleTimeString(),
    type,
    action,
    details
  };
  serviceLogs.unshift(entry);
  if (serviceLogs.length > 100) {
    serviceLogs = serviceLogs.slice(0, 100);
  }
  try {
    localStorage.setItem("YASHODA_SERVICE_AUDIT_LOGS", JSON.stringify(serviceLogs));
  } catch (e) {}
  console.log(`[SpreadsheetService] [${type}] [${action}] ${details}`);
}

// Safe string parser to filter undefined, null, or 'null' literals
const safeStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str === 'undefined' || str === 'null') return '';
  return str;
};

// Safe uppercase helper
const safeStrUpper = (val: any): string => {
  return safeStr(val).toUpperCase();
};

// Secure float helper
const parseNum = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

// Retrieve sheet ID dynamically from localStorage with hardcoded fallback
export function getSheetId(): string {
  const custom = localStorage.getItem('YASHODA_SHEET_ID');
  if (custom && custom.trim().length > 10) {
    return custom.trim();
  }
  return '1IoGYxMMOrVzkHyqp1n2InXgf14jLJUEfKZMX5MWVBj4';
}

export function setSheetId(id: string) {
  if (id) {
    localStorage.setItem('YASHODA_SHEET_ID', id.trim());
  } else {
    localStorage.removeItem('YASHODA_SHEET_ID');
  }
}

export function getAppsScriptUrl(): string {
  const custom = localStorage.getItem('YASHODA_APPS_SCRIPT_URL');
  if (custom && custom.trim().startsWith('http')) {
    return custom.trim();
  }
  return 'https://script.google.com/macros/s/AKfycbzsukRpBdg828rZI0YrgIaxs3Bh6VPl33dlMmRm0Vt3FsabaNZfavTUTzns3WayYTXR/exec';
}

export function setAppsScriptUrl(url: string) {
  if (url) {
    localStorage.setItem('YASHODA_APPS_SCRIPT_URL', url.trim());
  } else {
    localStorage.removeItem('YASHODA_APPS_SCRIPT_URL');
  }
}

// Local Overrides & Merging Setup
const EMPLOYEES_OVERRIDE_KEY = 'YASHODA_EMPLOYEES_OVERRIDE';
const EMPLOYEES_DELETED_KEY = 'YASHODA_EMPLOYEES_DELETED';

export function getLocalEmployees(): EmployeeRow[] {
  if (isOfflineMode()) {
    return dbGetEmployees();
  }
  try {
    const list = localStorage.getItem(EMPLOYEES_OVERRIDE_KEY);
    return list ? JSON.parse(list) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalEmployees(list: EmployeeRow[]) {
  if (isOfflineMode()) {
    dbSaveEmployees(list);
    return;
  }
  localStorage.setItem(EMPLOYEES_OVERRIDE_KEY, JSON.stringify(list));
}

export function getDeletedEmpCodes(): string[] {
  if (isOfflineMode()) {
    return [];
  }
  try {
    const list = localStorage.getItem(EMPLOYEES_DELETED_KEY);
    return list ? JSON.parse(list) : [];
  } catch (e) {
    return [];
  }
}

export function saveDeletedEmpCodes(codes: string[]) {
  if (isOfflineMode()) {
    return;
  }
  localStorage.setItem(EMPLOYEES_DELETED_KEY, JSON.stringify(codes));
}

/**
 * Universal Gviz Google Sheets reader
 */
export async function fetchSheetRows(sheetName: string): Promise<any[][]> {
  if (isOfflineMode()) {
    addServiceLog("INFO", "READ_SHEET_ROW_OFFLINE", `Local DB Active: Fetching "${sheetName}" from browser relational database.`);
    if (sheetName === "emp_details") {
      const emps = dbGetEmployees();
      return emps.map(p => [
        p.serialNumber, p.empCode, p.name, p.salaryType, p.department, p.designation, p.presentStatus, p.doj,
        p.basic, p.hra, p.conv, p.grossSalary, p.pf, p.esi, p.medi, p.pl, p.lta, p.bonus, p.gratuity, p.ctcPerMonth
      ]);
    } else if (sheetName === "leave_balance") {
      const leaves = dbGetLeaves();
      return leaves.map(p => [
        p.empCode, p.name, p.month, p.year, p.openingPL, p.openingSL, p.creditedPL, p.creditedSL, p.usedPL, p.usedSL, p.closingPL, p.closingSL
      ]);
    } else if (sheetName === "dashboard_summary") {
      const summaries = dbGetDashboardSummary();
      return summaries.map(p => [
        p.month, p.year, p.totalPaid, p.regularTotal, p.consolidatedTotal, p.status
      ]);
    } else {
      const parts = sheetName.split("_");
      const m = parts[0];
      const y = parts[1] || "2026";
      return dbGetMonthlyPayroll(m, y);
    }
  }

  const sheetId = getSheetId();
  addServiceLog("INFO", "READ_SHEET_ROW_START", `Requesting data from sheet: "${sheetName}" using spreadsheet: "${sheetId}"`);
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets responded with status ${response.status}: ${response.statusText}`);
    }
    const text = await response.text();
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!match) {
      throw new Error("Invalid Gviz query structure returned. Please make sure the sheet is published or shared with 'Anyone with the link can view'.");
    }
    const obj = JSON.parse(match[1]);
    
    // Check if Google Sheets claims there was an error fetching
    if (obj.status === 'error') {
      const reason = obj.errors?.[0]?.detailed_message || obj.errors?.[0]?.message || 'Unknown Google Sheets Gviz Error';
      throw new Error(`Google Sheets error: ${reason}`);
    }

    const table = obj.table;
    if (!table || !table.rows) {
      addServiceLog("SUCCESS", "READ_SHEET_ROW_EMPTY", `Successfully parsed tab "${sheetName}", but it contains 0 rows.`);
      return [];
    }

    const rows = table.rows.map((r: any) => {
      if (!r || !r.c) return [];
      return r.c.map((cell: any) => {
        if (!cell) return null;
        if (cell.f !== undefined) return cell.f;
        return cell.v;
      });
    });

    addServiceLog("SUCCESS", "READ_SHEET_ROW_OK", `Parsed ${rows.length} rows successfully from tab "${sheetName}".`);
    return rows;
  } catch (err: any) {
    console.error(`Error parsing sheet ${sheetName}:`, err);
    // Produce human-friendly sharing suggestions
    let friendlyMessage = err.message || String(err);
    if (friendlyMessage.includes("Failed to fetch") || friendlyMessage.includes("NetworkError")) {
      friendlyMessage = "CORS Policy Blocked Fetch. This happens when your Google Sheet is private. Open your Google Sheet, click 'Share' in the top-right, and change general access to 'Anyone with the link can view' (Viewer).";
    }
    addServiceLog("ERROR", "READ_SHEET_ROW_FAILED", `Failed to read tab "${sheetName}". Error: ${friendlyMessage}`);
    throw new Error(friendlyMessage);
  }
}

/**
 * Fetch employee details
 */
export async function fetchEmployeeDetails(): Promise<EmployeeRow[]> {
  if (isOfflineMode()) {
    addServiceLog("SUCCESS", "FETCH_EMPLOYEES_OFFLINE", "Loaded employees list from browser relational database.");
    return dbGetEmployees();
  }
  let sheetEmployees: EmployeeRow[] = [];
  try {
    const rawRows = await fetchSheetRows('emp_details');
    if (rawRows.length > 0) {
      const rows = rawRows.filter(row => row.length > 1 && safeStrUpper(row[1]) !== "EMP_CODE");
      sheetEmployees = rows
        .map((row) => ({
          serialNumber: safeStr(row[0]),
          empCode: safeStr(row[1]),
          name: safeStr(row[2]),
          salaryType: safeStrUpper(row[3]) === "COSOLIDATED" ? "CONSOLIDATED" : safeStrUpper(row[3]),
          department: safeStr(row[4]),
          designation: safeStr(row[5]),
          presentStatus: safeStrUpper(row[6]),
          doj: safeStr(row[7]),
          basic: parseNum(row[8]),
          hra: parseNum(row[9]),
          conv: parseNum(row[10]),
          grossSalary: parseNum(row[11]),
          pf: parseNum(row[12]),
          esi: parseNum(row[13]),
          medi: parseNum(row[14]),
          pl: parseNum(row[15]),
          lta: parseNum(row[16]),
          bonus: parseNum(row[17]),
          gratuity: parseNum(row[18]),
          ctcPerMonth: parseNum(row[19]),
        }))
        .filter(emp => emp.empCode !== '' && emp.name !== '');
    }
  } catch (err) {
    console.warn("Failed to fetch Google Sheet 'emp_details'. Using local overrides.", err);
  }

  // Retrieve current client-side updates
  const localList = getLocalEmployees();
  const deletedCodes = getDeletedEmpCodes();

  // 1. Remove deleted codes from our base roster
  let combined = sheetEmployees.filter(emp => !deletedCodes.includes(emp.empCode));

  // 2. Overwrite sheet records with modified values if match found
  combined = combined.map(emp => {
    const localMatch = localList.find(le => le.empCode === emp.empCode);
    return localMatch ? localMatch : emp;
  });

  // 3. Append brand new items that are not in the spreadsheet but saved locally
  localList.forEach(le => {
    if (!combined.some(emp => emp.empCode === le.empCode) && !deletedCodes.includes(le.empCode)) {
      combined.push(le);
    }
  });

  return combined;
}

/**
 * Fetch Leave balances
 */
export async function fetchLeaveBalances(): Promise<LeaveBalanceRow[]> {
  if (isOfflineMode()) {
    addServiceLog("SUCCESS", "FETCH_LEAVES_OFFLINE", "Loaded leave balances list from browser relational database.");
    return dbGetLeaves();
  }
  const rawRows = await fetchSheetRows('leave_balance');
  if (rawRows.length === 0) return [];
  const rows = rawRows.filter(row => row.length > 0 && safeStrUpper(row[0]) !== "EMP_CODE");
  return rows
    .map((row) => ({
      empCode: safeStr(row[0]),
      name: safeStr(row[1]),
      month: safeStr(row[2]),
      year: safeStr(row[3]),
      openingPL: parseNum(row[4]),
      openingSL: parseNum(row[5]),
      creditedPL: parseNum(row[6]),
      creditedSL: parseNum(row[7]),
      usedPL: parseNum(row[8]),
      usedSL: parseNum(row[9]),
      closingPL: parseNum(row[10]),
      closingSL: parseNum(row[11]),
    }))
    .filter(leave => leave.empCode !== '' && leave.name !== '');
}

/**
 * Fetch Dashboard summaries
 */
export async function fetchDashboardSummary(): Promise<DashboardSummaryRow[]> {
  if (isOfflineMode()) {
    addServiceLog("SUCCESS", "FETCH_DASHBOARD_OFFLINE", "Loaded monthly dashboard summaries from browser relational database.");
    return dbGetDashboardSummary();
  }
  const scriptUrl = getAppsScriptUrl();
  addServiceLog("INFO", "GET_DASHBOARD_START", `Connecting to Apps Script Web App for summary analytics...`);
  if (scriptUrl) {
    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "GET_DASHBOARD" })
      });
      if (response.ok) {
        const json = await response.json();
        if (json.status === "Success" && Array.isArray(json.data)) {
          addServiceLog("SUCCESS", "GET_DASHBOARD_OK", `Fetched ${json.data.length} months dashboard details from Apps Script.`);
          return json.data.map((item: any) => ({
            month: safeStr(item.month),
            year: safeStr(item.year),
            totalPaid: parseNum(item.total),
            regularTotal: parseNum(item.regular),
            consolidatedTotal: parseNum(item.consolidated),
            status: safeStr(item.status || "PROCESSED")
          })).filter((s: DashboardSummaryRow) => s.month !== '' && s.year !== '');
        } else {
          addServiceLog("ERROR", "GET_DASHBOARD_FAIL_BODY", `Apps Script returned status not successful: ${json.status || 'Unknown'}`);
        }
      } else {
        addServiceLog("ERROR", "GET_DASHBOARD_HTTP_ERROR", `Apps Script HTTP Status: ${response.status}`);
      }
    } catch (err: any) {
      addServiceLog("INFO", "GET_DASHBOARD_FALLBACK", `Web App API blocked or not configured (CORS/Private). Error: ${err.message || err}. Falling back to Gviz direct sheet fetch...`);
      console.warn("Web App API read failed or CORS blocked. Falling back to Gviz direct sheets fetch...", err);
    }
  }

  // Fallback to direct Gviz spreadsheet reader
  addServiceLog("INFO", "READ_DASHBOARD_GVIZ", `Fetching dashboard summaries directly from "dashboard_summary" sheet tab...`);
  const rawRows = await fetchSheetRows('dashboard_summary');
  if (rawRows.length === 0) return [];
  const rows = rawRows.filter(row => row.length > 0 && safeStrUpper(row[0]) !== "MONTH");
  const parsed = rows
    .map((row) => ({
      month: safeStr(row[0]),
      year: safeStr(row[1]),
      totalPaid: parseNum(row[2]),
      regularTotal: parseNum(row[3]),
      consolidatedTotal: parseNum(row[4]),
      status: safeStr(row[5]),
    }))
    .filter(s => s.month !== '' && s.year !== '');
  addServiceLog("SUCCESS", "READ_DASHBOARD_GVIZ_OK", `Successfully fetched and compiled ${parsed.length} items from worksheet.`);
  return parsed;
}
