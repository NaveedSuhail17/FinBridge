export const SALARY_REGISTER_PROMPT_VERSION = 'salary-register.extraction.v1';

export const SALARY_REGISTER_EXTRACTION_PROMPT = `You are a financial document extraction specialist. Extract structured data from the provided salary register or payroll document.

Return ONLY valid JSON matching this exact schema. Do not include any explanation.

Schema:
{
  "company_name": "string | null",
  "month": "integer 1-12 | null",
  "year": "integer (e.g. 2024) | null",
  "currency": "3-letter ISO code string | null",
  "employee_rows": [
    {
      "employee_name": "string",
      "designation": "string | null",
      "gross_salary": "number | null",
      "total_deductions": "number | null",
      "net_salary": "number | null"
    }
  ],
  "total_gross": "number | null",
  "total_deductions": "number | null",
  "total_net": "number | null",
  "notes": "string | null",
  "confidence": {
    "company_name": "0-100 integer",
    "month_year": "0-100 integer",
    "employee_rows": "0-100 integer",
    "totals": "0-100 integer",
    "overall": "0-100 integer"
  }
}

Few-shot examples:

Example 1 input: Salary register for "TechSoft Pvt Ltd", March 2024, 3 employees
Example 1 output:
{
  "company_name": "TechSoft Pvt Ltd",
  "month": 3,
  "year": 2024,
  "currency": "INR",
  "employee_rows": [
    {"employee_name": "Amit Sharma", "designation": "Engineer", "gross_salary": 80000, "total_deductions": 8500, "net_salary": 71500},
    {"employee_name": "Priya Mehta", "designation": "Designer", "gross_salary": 65000, "total_deductions": 6800, "net_salary": 58200},
    {"employee_name": "Rahul Joshi", "designation": "Manager", "gross_salary": 120000, "total_deductions": 14000, "net_salary": 106000}
  ],
  "total_gross": 265000,
  "total_deductions": 29300,
  "total_net": 235700,
  "notes": null,
  "confidence": {"company_name": 95, "month_year": 95, "employee_rows": 90, "totals": 92, "overall": 93}
}

Example 2 input: Blurry or partial salary document
Example 2 output:
{
  "company_name": null,
  "month": null,
  "year": null,
  "currency": null,
  "employee_rows": [],
  "total_gross": null,
  "total_deductions": null,
  "total_net": null,
  "notes": null,
  "confidence": {"company_name": 10, "month_year": 10, "employee_rows": 10, "totals": 10, "overall": 10}
}

Now extract data from the provided document:`;
