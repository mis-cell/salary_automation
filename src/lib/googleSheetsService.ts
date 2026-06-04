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

const SHEET_ID = '1IoGYxMMOrVzkHyqp1n2InXgf14jLJUEfKZMX5MWVBj4';
const SHEET_NAME = 'emp_details';

/**
 * Fetch employee details from the Google Sheet using the Google Sheets REST API.
 */
export async function fetchEmployeeDetails(accessToken: string): Promise<EmployeeRow[]> {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A2:T1000`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch from Google Sheets: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    return rows.map((row: any[]) => ({
      serialNumber: row[0] || '',
      empCode: row[1] || '',
      name: row[2] || '',
      salaryType: row[3] || '',
      department: row[4] || '',
      designation: row[5] || '',
      presentStatus: row[6] || '',
      doj: row[7] || '',
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
  } catch (error) {
    console.error('Error fetching employee details:', error);
    throw error;
  }
}
