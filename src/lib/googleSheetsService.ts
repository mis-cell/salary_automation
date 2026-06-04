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
  try {
    const list = localStorage.getItem(EMPLOYEES_OVERRIDE_KEY);
    return list ? JSON.parse(list) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalEmployees(list: EmployeeRow[]) {
  localStorage.setItem(EMPLOYEES_OVERRIDE_KEY, JSON.stringify(list));
}

export function getDeletedEmpCodes(): string[] {
  try {
    const list = localStorage.getItem(EMPLOYEES_DELETED_KEY);
    return list ? JSON.parse(list) : [];
  } catch (e) {
    return [];
  }
}

export function saveDeletedEmpCodes(codes: string[]) {
  localStorage.setItem(EMPLOYEES_DELETED_KEY, JSON.stringify(codes));
}

/**
 * Universal Gviz Google Sheets reader
 */
async function fetchSheetRows(sheetName: string): Promise<any[][]> {
  const sheetId = getSheetId();
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
    if (!table || !table.rows) return [];

    return table.rows.map((r: any) => {
      if (!r || !r.c) return [];
      return r.c.map((cell: any) => {
        if (!cell) return null;
        if (cell.f !== undefined) return cell.f;
        return cell.v;
      });
    });
  } catch (err: any) {
    console.error(`Error parsing sheet ${sheetName}:`, err);
    // Produce human-friendly sharing suggestions
    let friendlyMessage = err.message || String(err);
    if (friendlyMessage.includes("Failed to fetch") || friendlyMessage.includes("NetworkError")) {
      friendlyMessage = "CORS Policy Blocked Fetch. This happens when your Google Sheet is private. Open your Google Sheet, click 'Share' in the top-right, and change general access to 'Anyone with the link can view' (Viewer).";
    }
    throw new Error(friendlyMessage);
  }
}

/**
 * Fetch employee details
 */
export async function fetchEmployeeDetails(): Promise<EmployeeRow[]> {
  let sheetEmployees: EmployeeRow[] = [];
  try {
    const rawRows = await fetchSheetRows('emp_details');
    if (rawRows.length > 0) {
      const rows = rawRows.slice(1);
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
  const rawRows = await fetchSheetRows('leave_balance');
  if (rawRows.length === 0) return [];
  const rows = rawRows.slice(1);
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
  const scriptUrl = getAppsScriptUrl();
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
          return json.data.map((item: any) => ({
            month: safeStr(item.month),
            year: safeStr(item.year),
            totalPaid: parseNum(item.total),
            regularTotal: parseNum(item.regular),
            consolidatedTotal: parseNum(item.consolidated),
            status: safeStr(item.status || "PROCESSED")
          })).filter((s: DashboardSummaryRow) => s.month !== '' && s.year !== '');
        }
      }
    } catch (err) {
      console.warn("Web App API read failed or CORS blocked. Falling back to Gviz direct sheets fetch...", err);
    }
  }

  // Fallback to direct Gviz spreadsheet reader
  const rawRows = await fetchSheetRows('dashboard_summary');
  if (rawRows.length === 0) return [];
  const rows = rawRows.slice(1);
  return rows
    .map((row) => ({
      month: safeStr(row[0]),
      year: safeStr(row[1]),
      totalPaid: parseNum(row[2]),
      regularTotal: parseNum(row[3]),
      consolidatedTotal: parseNum(row[4]),
      status: safeStr(row[5]),
    }))
    .filter(s => s.month !== '' && s.year !== '');
}
