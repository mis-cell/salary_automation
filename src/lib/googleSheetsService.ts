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

const SHEET_ID = '1IoGYxMMOrVzkHyqp1n2InXgf14jLJUEfKZMX5MWVBj4';

// Secure float helper
const parseNum = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Universal Gviz Google Sheets reader
 */
async function fetchSheetRows(sheetName: string): Promise<any[][]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Sheets: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!match) {
      throw new Error("Invalid Gviz query response wrapper structure.");
    }
    const obj = JSON.parse(match[1]);
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
  } catch (err) {
    console.error(`Error parsing sheet ${sheetName}:`, err);
    throw err;
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
