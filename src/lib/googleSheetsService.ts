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
  const rawRows = await fetchSheetRows('emp_details');
  if (rawRows.length === 0) return [];
  // Skip header row
  const rows = rawRows.slice(1);
  return rows.map((row) => ({
    serialNumber: row[0] !== null ? String(row[0]).trim() : '',
    empCode: row[1] !== null ? String(row[1]).trim() : '',
    name: row[2] !== null ? String(row[2]).trim() : '',
    salaryType: row[3] !== null ? String(row[3]).trim().toUpperCase() : '',
    department: row[4] !== null ? String(row[4]).trim() : '',
    designation: row[5] !== null ? String(row[5]).trim() : '',
    presentStatus: row[6] !== null ? String(row[6]).trim().toUpperCase() : '',
    doj: row[7] !== null ? String(row[7]).trim() : '',
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
  }));
}

/**
 * Fetch Leave balances
 */
export async function fetchLeaveBalances(): Promise<LeaveBalanceRow[]> {
  const rawRows = await fetchSheetRows('leave_balance');
  if (rawRows.length === 0) return [];
  const rows = rawRows.slice(1);
  return rows.map((row) => ({
    empCode: row[0] !== null ? String(row[0]).trim() : '',
    name: row[1] !== null ? String(row[1]).trim() : '',
    month: row[2] !== null ? String(row[2]).trim() : '',
    year: row[3] !== null ? String(row[3]).trim() : '',
    openingPL: parseNum(row[4]),
    openingSL: parseNum(row[5]),
    creditedPL: parseNum(row[6]),
    creditedSL: parseNum(row[7]),
    usedPL: parseNum(row[8]),
    usedSL: parseNum(row[9]),
    closingPL: parseNum(row[10]),
    closingSL: parseNum(row[11]),
  }));
}

/**
 * Fetch Dashboard summaries
 */
export async function fetchDashboardSummary(): Promise<DashboardSummaryRow[]> {
  const rawRows = await fetchSheetRows('dashboard_summary');
  if (rawRows.length === 0) return [];
  const rows = rawRows.slice(1);
  return rows.map((row) => ({
    month: row[0] !== null ? String(row[0]).trim() : '',
    year: row[1] !== null ? String(row[1]).trim() : '',
    totalPaid: parseNum(row[2]),
    regularTotal: parseNum(row[3]),
    consolidatedTotal: parseNum(row[4]),
    status: row[5] !== null ? String(row[5]).trim() : '',
  }));
}
