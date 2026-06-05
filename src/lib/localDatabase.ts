import { EmployeeRow, LeaveBalanceRow, DashboardSummaryRow } from "./googleSheetsService";

// Safe numeric and string parsers for calculation
const parseNum = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  const clean = String(val).replace(/[^\d.-]/g, "");
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

// Initial local seeds so the app starts fully populated and working!
const SEED_EMPLOYEES: EmployeeRow[] = [
  {
    serialNumber: "1",
    empCode: "EMP001",
    name: "Yashoda Sharma",
    salaryType: "REGULAR",
    department: "Administration",
    designation: "General Manager",
    presentStatus: "ACTIVE",
    doj: "2020-01-15",
    basic: 45000,
    hra: 18000,
    conv: 2000,
    grossSalary: 65000,
    pf: 1800,
    esi: 0,
    medi: 1250,
    pl: 15,
    lta: 0,
    bonus: 5000,
    gratuity: 0,
    ctcPerMonth: 73050
  },
  {
    serialNumber: "2",
    empCode: "EMP002",
    name: "Rajesh Kumar",
    salaryType: "REGULAR",
    department: "Operations",
    designation: "Assistant Manager",
    presentStatus: "ACTIVE",
    doj: "2021-05-10",
    basic: 28000,
    hra: 11200,
    conv: 1600,
    grossSalary: 40800,
    pf: 1800,
    esi: 306,
    medi: 0,
    pl: 12,
    lta: 0,
    bonus: 3000,
    gratuity: 0,
    ctcPerMonth: 45906
  },
  {
    serialNumber: "3",
    empCode: "EMP003",
    name: "Komal Patel",
    salaryType: "CONSOLIDATED",
    department: "Nursing",
    designation: "Staff Nurse",
    presentStatus: "ACTIVE",
    doj: "2022-09-01",
    basic: 0,
    hra: 0,
    conv: 0,
    grossSalary: 0,
    pf: 0,
    esi: 0,
    medi: 0,
    pl: 10,
    lta: 0,
    bonus: 0,
    gratuity: 0,
    ctcPerMonth: 22000  // Consolidated total salary
  },
  {
    serialNumber: "4",
    empCode: "EMP004",
    name: "Arjun Singh",
    salaryType: "REGULAR",
    department: "Support Staff",
    designation: "Security Officer",
    presentStatus: "ACTIVE",
    doj: "2023-02-18",
    basic: 13000,
    hra: 5200,
    conv: 1000,
    grossSalary: 19200,
    pf: 1560,
    esi: 144,
    medi: 0,
    pl: 8,
    lta: 0,
    bonus: 1500,
    gratuity: 0,
    ctcPerMonth: 22404
  },
  {
    serialNumber: "5",
    empCode: "EMP005",
    name: "Sunita Reddy",
    salaryType: "CONSOLIDATED",
    department: "Housekeeping",
    designation: "Supervisor",
    presentStatus: "ACTIVE",
    doj: "2023-07-20",
    basic: 0,
    hra: 0,
    conv: 0,
    grossSalary: 0,
    pf: 0,
    esi: 0,
    medi: 0,
    pl: 6,
    lta: 0,
    bonus: 0,
    gratuity: 0,
    ctcPerMonth: 16500
  }
];

const SEED_LEAVES: LeaveBalanceRow[] = [
  { empCode: "EMP001", name: "Yashoda Sharma", month: "June", year: "2026", openingPL: 8, openingSL: 4, creditedPL: 1, creditedSL: 0.5, usedPL: 2, usedSL: 0, closingPL: 7, closingSL: 4.5 },
  { empCode: "EMP002", name: "Rajesh Kumar", month: "June", year: "2026", openingPL: 10, openingSL: 5, creditedPL: 1, creditedSL: 0.5, usedPL: 0, usedSL: 1, closingPL: 11, closingSL: 4.5 },
  { empCode: "EMP003", name: "Komal Patel", month: "June", year: "2026", openingPL: 6, openingSL: 3, creditedPL: 1, creditedSL: 0.5, usedPL: 1, usedSL: 0, closingPL: 6, closingSL: 3.5 },
  { empCode: "EMP004", name: "Arjun Singh", month: "June", year: "2026", openingPL: 4, openingSL: 2, creditedPL: 1, creditedSL: 0.5, usedPL: 0, usedSL: 0, closingPL: 5, closingSL: 2.5 },
  { empCode: "EMP005", name: "Sunita Reddy", month: "June", year: "2026", openingPL: 3, openingSL: 1, creditedPL: 1, creditedSL: 0.5, usedPL: 2, usedSL: 1, closingPL: 2, closingSL: 0.5 }
];

// Offline database store keys
const OFFLINE_DB_EMPLOYEES = "YASHODA_OFFLINE_DB_EMPLOYEES";
const OFFLINE_DB_LEAVES = "YASHODA_OFFLINE_DB_LEAVES";
const OFFLINE_DB_PAYROLL_PREFIX = "YASHODA_OFFLINE_DB_PAYROLL_";
const OFFLINE_DB_DASHBOARD = "YASHODA_OFFLINE_DB_DASHBOARD_SUMMARY";

// Helper checking if Offline Mode is toggled (defaults to TRUE to support fully offline out-of-the-box)
export function isOfflineMode(): boolean {
  return localStorage.getItem("YASHODA_OFFLINE_MODE") !== "false";
}

export function setOfflineMode(enabled: boolean) {
  localStorage.setItem("YASHODA_OFFLINE_MODE", enabled ? "true" : "false");
}

// Initialise Database if empty
export function initOfflineDatabase() {
  if (!localStorage.getItem(OFFLINE_DB_EMPLOYEES)) {
    localStorage.setItem(OFFLINE_DB_EMPLOYEES, JSON.stringify(SEED_EMPLOYEES));
  }
  if (!localStorage.getItem(OFFLINE_DB_LEAVES)) {
    localStorage.setItem(OFFLINE_DB_LEAVES, JSON.stringify(SEED_LEAVES));
  }
  if (!localStorage.getItem(OFFLINE_DB_DASHBOARD)) {
    const defaultDashboard: DashboardSummaryRow[] = [
      { month: "April", year: "2026", totalPaid: 144300, regularTotal: 105800, consolidatedTotal: 38500, status: "PROCESSED" },
      { month: "May", year: "2026", totalPaid: 144300, regularTotal: 105800, consolidatedTotal: 38500, status: "PROCESSED" }
    ];
    localStorage.setItem(OFFLINE_DB_DASHBOARD, JSON.stringify(defaultDashboard));
    
    // Process and seed corresponding payroll tables
    const aprPayroll = SEED_EMPLOYEES.map(emp => computePayrollRowOffline(emp, 30, "April", "2026"));
    const mayPayroll = SEED_EMPLOYEES.map(emp => computePayrollRowOffline(emp, 31, "May", "2026"));
    localStorage.setItem(`${OFFLINE_DB_PAYROLL_PREFIX}April_2026`, JSON.stringify(aprPayroll));
    localStorage.setItem(`${OFFLINE_DB_PAYROLL_PREFIX}May_2026`, JSON.stringify(mayPayroll));
  }
}

// Wipe & Reseed Database
export function resetOfflineDatabase() {
  localStorage.removeItem(OFFLINE_DB_EMPLOYEES);
  localStorage.removeItem(OFFLINE_DB_LEAVES);
  localStorage.removeItem(OFFLINE_DB_DASHBOARD);
  
  // Wipe all payroll tabs
  const keys = Object.keys(localStorage);
  keys.forEach(k => {
    if (k.startsWith(OFFLINE_DB_PAYROLL_PREFIX)) {
      localStorage.removeItem(k);
    }
  });
  
  initOfflineDatabase();
}

/**
 * COMPUTE PAYROLL ROW OFFLINE (Formula Replication from Apps Script)
 * This replicates 100% of the math and parameters for full offline computing!
 */
export function computePayrollRowOffline(emp: EmployeeRow, payableDays: number, month: string, year: string) {
  const salaryType = emp.salaryType.toUpperCase();
  const maxDays = getDaysInMonth(month, year);
  const factor = payableDays / maxDays;

  let actualBasic = 0;
  let payableBasic = 0;
  let actualHra = 0;
  let payableHra = 0;
  let actualGross = 0;
  let payableGross = 0;
  let actualConsol = 0;
  let payableConsol = 0;
  let pf = 0;
  let esi = 0;
  let ptax = 0;
  let netPay = 0;

  if (salaryType === "REGULAR") {
    actualBasic = emp.basic;
    payableBasic = Math.round(actualBasic * factor);

    actualHra = emp.hra;
    payableHra = Math.round(actualHra * factor);

    actualGross = actualBasic + actualHra + (emp.conv || 0);
    // Gross = Basic + HRA + Conveyance
    payableGross = payableBasic + payableHra + Math.round((emp.conv || 0) * factor);

    // Provident Fund (PF) PF is 12% of payable basic or 15000 max = 1800 limit
    if (emp.pf > 0) {
      pf = Math.round(payableBasic * 0.12);
      if (pf > 1800) pf = 1800;
    }

    // ESI (0.75% of payable gross if gross is under 21000)
    if (emp.esi > 0 && emp.grossSalary < 21000) {
      esi = Math.round(payableGross * 0.0075);
    }

    // Professional Tax (PTAX) Standard Indian Slabs
    if (payableGross > 15000) {
      ptax = 200;
    } else if (payableGross > 10000) {
      ptax = 150;
    } else if (payableGross > 7500) {
      ptax = 110;
    }

    netPay = payableGross - pf - esi - ptax;
  } else {
    // CONSOLIDATED
    actualConsol = emp.ctcPerMonth; // Integrated single month salary
    payableConsol = Math.round(actualConsol * factor);
    payableGross = payableConsol;

    // Direct flat deductions represent consolidated if set
    pf = 0;
    esi = 0;
    ptax = 0;
    netPay = payableConsol;
  }

  // Create printable visual invoice slip pdf url fallback
  const pdfUrl = `javascript:alert('Windows 7 Offline Engine: System running Local Relational DB. Click on \"Print Payslip\" to generate and print invoice for ${emp.name} instantly!');`;

  return {
    empCode: emp.empCode,
    name: emp.name,
    type: salaryType,
    payableDays: payableDays,
    actualBasic,
    payableBasic,
    actualHra,
    payableHra,
    actualGross,
    payableGross,
    actualConsol,
    payableConsol,
    ptax,
    pf,
    esi,
    netPay,
    pdfUrl
  };
}

// Helpers
function getDaysInMonth(month: string, year: string): number {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const mIndex = months.indexOf(month);
  if (mIndex === -1) return 30;
  const yr = parseInt(year) || 2026;
  return new Date(yr, mIndex + 1, 0).getDate();
}

/**
 * OFFLINE DATABASE TRANSACTION WORKFLOWS
 */

// get absolute directory of employees
export function dbGetEmployees(): EmployeeRow[] {
  initOfflineDatabase();
  return JSON.parse(localStorage.getItem(OFFLINE_DB_EMPLOYEES) || "[]");
}

export function dbSaveEmployees(list: EmployeeRow[]) {
  localStorage.setItem(OFFLINE_DB_EMPLOYEES, JSON.stringify(list));
}

// get absolute database of leave balances 
export function dbGetLeaves(): LeaveBalanceRow[] {
  initOfflineDatabase();
  return JSON.parse(localStorage.getItem(OFFLINE_DB_LEAVES) || "[]");
}

export function dbSaveLeaves(list: LeaveBalanceRow[]) {
  localStorage.setItem(OFFLINE_DB_LEAVES, JSON.stringify(list));
}

// get absolute database of monthly summary
export function dbGetDashboardSummary(): DashboardSummaryRow[] {
  initOfflineDatabase();
  return JSON.parse(localStorage.getItem(OFFLINE_DB_DASHBOARD) || "[]");
}

export function dbSaveDashboardSummary(list: DashboardSummaryRow[]) {
  localStorage.setItem(OFFLINE_DB_DASHBOARD, JSON.stringify(list));
}

// Get monthly payroll entries
export function dbGetMonthlyPayroll(month: string, year: string): any[][] {
  const storeKey = `${OFFLINE_DB_PAYROLL_PREFIX}${month}_${year}`;
  const localData = localStorage.getItem(storeKey);
  if (!localData) return [];
  
  const parsed = JSON.parse(localData);
  if (!Array.isArray(parsed)) return [];
  
  // Map back to double-array rows representing Google Sheet cells format for 100% downstream compatibility!
  // Col positions match fetchSheetRows index perfectly!
  return parsed.map(p => [
    p.empCode,
    p.name,
    p.type,
    p.payableDays,
    p.actualBasic || 0,
    p.payableBasic || 0,
    p.actualHra || 0,
    p.payableHra || 0,
    p.actualGross || 0,
    p.payableGross || 0,
    p.actualConsol || 0,
    p.payableConsol || 0,
    p.ptax || 0,
    p.pf || 0,
    p.esi || 0,
    p.netPay || 0,
    p.pdfUrl || ""
  ]);
}

// Save monthly payroll entries and update dashboard summaries automatically!
export function dbProcessPayroll(month: string, year: string, payableDays: number, selectedEmpCodes: string[], customEditions: any[]) {
  initOfflineDatabase();
  
  // Get all master employees to process
  const allMaster = dbGetEmployees();
  const targetEmployees = allMaster.filter(emp => selectedEmpCodes.includes(emp.empCode));
  
  // Process each employee
  const processed = targetEmployees.map(emp => {
    // Check if custom edited parameters exist in grid
    const custom = customEditions.find(c => c.empCode === emp.empCode);
    const useDays = custom ? parseNum(custom.payableDays) : payableDays;
    
    // In offline mode we calculate parameters dynamically inside this relational client engine
    return computePayrollRowOffline(emp, useDays, month, year);
  });
  
  // Save payroll table representing the tab
  const storeKey = `${OFFLINE_DB_PAYROLL_PREFIX}${month}_${year}`;
  localStorage.setItem(storeKey, JSON.stringify(processed));
  
  // Automatically calculate metrics and write to Dashboard summarizes table!
  const regularTotal = processed
    .filter(p => p.type === "REGULAR")
    .reduce((sum, current) => sum + current.netPay, 0);

  const consolidatedTotal = processed
    .filter(p => p.type === "CONSOLIDATED")
    .reduce((sum, current) => sum + current.netPay, 0);

  const totalPaid = regularTotal + consolidatedTotal;

  // Retrieve dashboard state
  let summaries = dbGetDashboardSummary();
  const existingIndex = summaries.findIndex(s => s.month === month && s.year === year);
  
  const updatedRow: DashboardSummaryRow = {
    month,
    year,
    totalPaid,
    regularTotal,
    consolidatedTotal,
    status: "PROCESSED"
  };
  
  if (existingIndex !== -1) {
    summaries[existingIndex] = updatedRow;
  } else {
    summaries.push(updatedRow);
  }
  
  dbSaveDashboardSummary(summaries);
  return processed;
}
