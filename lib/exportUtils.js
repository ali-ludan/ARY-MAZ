// ========== CSV EXPORT UTILITIES ==========

import { formatAED, formatPct, formatSqft } from './formatters';

/**
 * Export data as CSV file
 */
export function exportCSV(filename, headers, rows) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const str = String(cell === null || cell === undefined ? '' : cell);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export single unit calculation (Module 1)
 */
export function exportSingleUnitCSV(unit, calcResults) {
  const headers = [
    'Unit No', 'Type', 'Status', 'Internal sqft', 'Balcony sqft', 'Net sqft',
    'Rate AED/sqft', 'Selling Price', 'Discount %', 'Discount Amount', 'Net Price',
    'Net PSF', 'DLD %', 'DLD Amount', 'Admin Fee', 'Down Payment %',
    'Down Payment Amount', 'Immediate Due', 'Total Outflow', 'Booking Date',
    'Pre-Launch Price', 'Premium %'
  ];
  const row = [
    unit.unit_no,
    unit.bedrooms || '—',
    unit.status,
    unit.internal_sqft,
    unit.balcony_sqft,
    unit.net_sqft,
    unit.rate,
    unit.selling_price,
    calcResults.totalDiscountPct,
    calcResults.discountAmount,
    calcResults.netPrice,
    calcResults.netPSF,
    calcResults.dldPct,
    calcResults.dldFee,
    calcResults.adminFee,
    calcResults.downPct,
    calcResults.downPayment,
    calcResults.immediateDue,
    calcResults.totalOutflow,
    calcResults.bookingDate,
    unit.pre_launch_price,
    calcResults.premiumPct
  ];
  exportCSV('unit_' + unit.unit_no + '_calculation', headers, [row]);
}

/**
 * Export batch calculation (Module 2)
 */
export function exportBatchCSV(batchUnits, calcFn) {
  const headers = [
    'Unit No', 'Type', 'Status', 'Internal sqft', 'Balcony sqft', 'Net sqft',
    'Rate AED/sqft', 'Selling Price', 'Discount %', 'Discount Amount', 'Net Price',
    'Net PSF', 'DLD %', 'DLD Amount', 'Admin Fee', 'Down Payment %',
    'Down Payment Amount', 'Immediate Due', 'Total Outflow', 'Booking Date',
    'Pre-Launch Price', 'Premium %'
  ];
  
  const rows = batchUnits.map(u => {
    const calc = calcFn(u);
    return [
      u.unit_no, u.bedrooms || '—', u.status, u.internal_sqft, u.balcony_sqft,
      u.net_sqft, u.rate, u.selling_price, calc.totalDiscountPct, calc.discountAmount,
      calc.netPrice, calc.netPSF, calc.dldPct, calc.dldFee, calc.adminFee,
      calc.downPct, calc.downPayment, calc.immediateDue, calc.totalOutflow,
      calc.bookingDate, u.pre_launch_price, calc.premiumPct
    ];
  });
  
  // Totals row
  const totals = rows.reduce((acc, row) => {
    return acc.map((v, i) => {
      if (typeof row[i] === 'number') return v + row[i];
      return v;
    });
  }, new Array(headers.length).fill(0));
  totals[0] = 'TOTALS';
  totals[1] = '';
  totals[2] = '';
  totals[19] = '';
  
  rows.push(totals);
  exportCSV('batch_calculation', headers, rows);
}

/**
 * Export inventory table (Module 4)
 */
export function exportInventoryCSV(units) {
  const headers = [
    'Unit No', 'Type', 'Status', 'Internal sqft', 'Balcony sqft', 'Net sqft',
    'Rate AED/sqft', 'Pre-Launch Price', 'Selling Price', 'Premium %'
  ];
  const rows = units.map(u => [
    u.unit_no,
    u.bedrooms || '—',
    u.status,
    u.internal_sqft,
    u.balcony_sqft || 0,
    u.net_sqft,
    u.rate,
    u.pre_launch_price,
    u.selling_price,
    u.pre_launch_price > 0 ? (((u.selling_price - u.pre_launch_price) / u.pre_launch_price) * 100).toFixed(1) : '—'
  ]);
  exportCSV('inventory_export', headers, rows);
}

/**
 * Generate WhatsApp message
 */
export function generateWhatsAppMessage(unit, calcResults) {
  const msg = [
    `ARY & MAZ Developments`,
    `Unit: ${unit.unit_no} | ${unit.bedrooms || 'N/A'}`,
    `Size: ${unit.net_sqft} sqft`,
    `Selling Price: AED ${formatAED(unit.selling_price)}`,
    `Discount: ${formatPct(calcResults.totalDiscountPct)}`,
    `Net Price: AED ${formatAED(calcResults.netPrice)}`,
    `DLD/Oqood: AED ${formatAED(calcResults.dldFee)}`,
    `Admin Fee: AED ${formatAED(calcResults.adminFee)}`,
    `Down Payment: AED ${formatAED(calcResults.downPayment)}`,
    `Immediate Due: AED ${formatAED(calcResults.immediateDue)}`,
    `Total Outflow: AED ${formatAED(calcResults.totalOutflow)}`
  ].join('\n');
  return msg;
}

/**
 * Generate email body
 */
export function generateEmailBody(unit, calcResults) {
  return generateWhatsAppMessage(unit, calcResults);
}
