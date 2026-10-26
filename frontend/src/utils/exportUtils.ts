import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AmortizationYearEntry, CurrencyType, EmiCalculationResult, LoanComparisonResult, MultiScenarioMatrixResult } from '../types';
import { formatCurrency, formatPercent } from './formatters';

export function exportScheduleToCsv(yearlySchedule: AmortizationYearEntry[], currency: CurrencyType = 'INR', filename = 'amortization-schedule.csv') {
  const headers = ['Year', 'Beginning Balance', 'Principal Paid', 'Interest Paid', 'Prepayments', 'Total Payment', 'Ending Balance', 'Remaining %'];

  const rows: (string | number)[][] = [headers];

  yearlySchedule.forEach((y) => {
    rows.push([
      `Year ${y.year}`,
      y.beginningBalance,
      y.principalPaid,
      y.interestPaid,
      y.prepaymentsPaid,
      y.totalPayment,
      y.endingBalance,
      `${y.loanBalancePercentage}%`,
    ]);

    // Also include months indented
    y.months.forEach((m) => {
      rows.push([
        `  Month ${m.month} (${m.date})`,
        m.beginningBalance,
        m.principal,
        m.interest,
        m.prepayment,
        m.emi,
        m.endingBalance,
        '',
      ]);
    });
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportScheduleToPdf(
  result: EmiCalculationResult,
  loanTitle: string,
  currency: CurrencyType = 'INR'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header background banner
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 0, 210, 28, 'F');

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('LoanPro - Financial Statement', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 155, 18);

  // Subtitle
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(loanTitle, 14, 38);

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 43, 182, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 43, 182, 38, 3, 3, 'S');

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Monthly EMI', 22, 52);
  doc.text('Principal Amount', 68, 52);
  doc.text('Total Interest', 114, 52);
  doc.text('Total Repayment', 158, 52);

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(result.monthlyEmi, currency), 22, 62);
  doc.text(formatCurrency(result.principalAmount, currency), 68, 62);
  doc.text(formatCurrency(result.totalInterest, currency), 114, 62);
  doc.text(formatCurrency(result.totalPayment, currency), 158, 62);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Effective APR: ${result.effectiveApr}%`, 22, 74);
  doc.text(`Upfront Fees: ${formatCurrency(result.totalUpfrontCharges, currency)}`, 68, 74);
  doc.text(`Interest Share: ${result.interestToPrincipalRatio}%`, 114, 74);

  // Amortization Table
  const tableData = result.schedule.yearly.map((y) => [
    `Year ${y.year}`,
    formatCurrency(y.beginningBalance, currency),
    formatCurrency(y.principalPaid, currency),
    formatCurrency(y.interestPaid, currency),
    formatCurrency(y.prepaymentsPaid, currency),
    formatCurrency(y.totalPayment, currency),
    formatCurrency(y.endingBalance, currency),
    `${y.loanBalancePercentage}%`,
  ]);

  autoTable(doc, {
    startY: 88,
    head: [['Period', 'Opening Balance', 'Principal', 'Interest', 'Prepayment', 'Total Paid', 'Ending Balance', 'Bal %']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: 2.5,
    },
  });

  doc.save(`${loanTitle.toLowerCase().replace(/\s+/g, '-')}-statement.pdf`);
}

export function exportComparisonToPdf(comparison: LoanComparisonResult, currency: CurrencyType = 'INR') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LoanPro - Side-by-Side Loan Comparison Report', 14, 16);

  const tableData = comparison.offers.map((o) => [
    o.bankName + (o.id === comparison.bestOverallOfferId ? ' (Best Value)' : ''),
    formatCurrency(o.principal, currency),
    `${o.annualRate}%`,
    `${Math.round(o.tenureMonths / 12)} Yrs`,
    formatCurrency(o.monthlyEmi, currency),
    formatCurrency(o.totalInterest, currency),
    formatCurrency(o.totalFees, currency),
    formatCurrency(o.totalCost, currency),
    `${o.effectiveApr}%`,
    o.differenceFromCheapestTotal === 0 ? 'Lowest Cost' : `+${formatCurrency(o.differenceFromCheapestTotal, currency)}`,
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['Bank / Lender', 'Loan Amount', 'Rate (p.a.)', 'Tenure', 'Monthly EMI', 'Total Interest', 'Fees & Taxes', 'Total Cost', 'APR', 'Difference']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [15, 23, 42],
    },
  });

  doc.save('loan-comparison-report.pdf');
}

export function exportMultiScenarioToCsv(result: MultiScenarioMatrixResult, currency: CurrencyType = 'INR', filename = 'home-loan-rate-tenure-matrix.csv') {
  const rows: (string | number)[][] = [];

  // Title & Metadata
  rows.push(['LoanPro Home Loan Multi-Rate & Tenure Scenario Matrix']);
  rows.push(['Loan Principal Amount', result.principal]);
  rows.push(['Baseline Interest Rate', `${result.baseScenario.annualRate}%`]);
  rows.push(['Baseline Tenure', `${result.baseScenario.tenureYears} Years (${result.baseScenario.tenureMonths} Months)`]);
  rows.push(['Baseline Monthly EMI', result.baseScenario.monthlyEmi]);
  rows.push(['Baseline Total Interest', result.baseScenario.totalInterest]);
  rows.push([]);

  // Matrix Headers
  const headerRow = ['Interest Rate (p.a.)'];
  result.tenuresYears.forEach((t) => {
    headerRow.push(`${t} Yrs (${t * 12}M) - EMI`);
    headerRow.push(`${t} Yrs - Total Interest`);
    headerRow.push(`${t} Yrs - Total Payment`);
  });
  rows.push(headerRow);

  // Matrix Data Rows
  result.matrix.forEach((rateRow) => {
    const row: (string | number)[] = [`${rateRow[0].annualRate}%`];
    rateRow.forEach((cell) => {
      row.push(cell.monthlyEmi);
      row.push(cell.totalInterest);
      row.push(cell.totalPayment);
    });
    rows.push(row);
  });

  rows.push([]);
  rows.push(['Repayment Advisory Insights']);
  rows.push([
    'Tenure Cut Savings',
    `Cutting from ${result.advisoryInsights.tenureCutSavings.fromYears} to ${result.advisoryInsights.tenureCutSavings.toYears} Yrs`,
    `Monthly EMI increase: ${result.advisoryInsights.tenureCutSavings.monthlyEmiIncrease}`,
    `Lifetime interest saved: ${result.advisoryInsights.tenureCutSavings.lifetimeInterestSaved}`,
  ]);
  rows.push([
    'Rate Hike Impact',
    `+${result.advisoryInsights.rateHikeImpact.hikePercent}% rate hike to ${result.advisoryInsights.rateHikeImpact.revisedRate}%`,
    `Monthly EMI increase: ${result.advisoryInsights.rateHikeImpact.monthlyEmiIncrease}`,
    `Lifetime interest increase: ${result.advisoryInsights.rateHikeImpact.lifetimeInterestIncrease}`,
    `Equivalent lump sum prepayment needed: ${result.advisoryInsights.rateHikeImpact.equivalentLumpSumPrepayment}`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((cell) => `"${cell}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportMultiScenarioToPdf(result: MultiScenarioMatrixResult, currency: CurrencyType = 'INR') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LoanPro - Home Loan Multi-Rate & Tenure Scenario Matrix', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Principal: ${formatCurrency(result.principal, currency)} | Base: ${result.baseScenario.annualRate}% @ ${result.baseScenario.tenureYears} Yrs`, 180, 16);

  // Table Headers
  const tableHead = ['Interest Rate (p.a.)'];
  result.tenuresYears.forEach((t) => {
    tableHead.push(`${t} Years EMI / Total Int.`);
  });

  const tableBody = result.matrix.map((rateRow) => {
    const row = [`${rateRow[0].annualRate}%`];
    rateRow.forEach((cell) => {
      row.push(`${formatCurrency(cell.monthlyEmi, currency)}\n(Int: ${formatCurrency(cell.totalInterest, currency, true)})`);
    });
    return row;
  });

  autoTable(doc, {
    startY: 30,
    head: [tableHead],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
  });

  doc.save('home-loan-rate-tenure-matrix.pdf');
}
