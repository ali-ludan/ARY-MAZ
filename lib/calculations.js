// ========== FINANCIAL CALCULATION ENGINE ==========

/**
 * HANDOVER_DATE — UPDATE THIS FOR EACH NEW PROJECT.
 * All pre-handover payment schedules are calculated relative to this date.
 */
export const HANDOVER_DATE = new Date(2028, 11, 31); // Dec 31 2028

// Runtime guard: warn loudly if handover date is already in the past
if (HANDOVER_DATE < new Date()) {
  console.error(
    '[calculations.js] HANDOVER_DATE is in the past — payment schedules will be incorrect. ' +
    'Update HANDOVER_DATE at the top of lib/calculations.js for this project.'
  );
}

/**
 * Calculate auto discount based on down payment above 15%
 */
export function calcAutoDiscount(downPct) {
  const extraSteps = Math.floor((downPct - 15) / 5);
  return Math.max(0, extraSteps * 0.5);
}

/**
 * Calculate total discount (manual + auto)
 */
export function calcTotalDiscount(manualDiscount, downPct) {
  return manualDiscount + calcAutoDiscount(downPct);
}

/**
 * Calculate net price after discount
 */
export function calcNetPrice(sellingPrice, totalDiscountPct) {
  return sellingPrice * (1 - totalDiscountPct / 100);
}

/**
 * Calculate DLD fee
 */
export function calcDLDFee(netPrice, dldPct) {
  return netPrice * (dldPct / 100);
}

/**
 * Calculate down payment amount
 */
export function calcDownPayment(netPrice, downPct) {
  return netPrice * (downPct / 100);
}

/**
 * Calculate immediate due (down + DLD + admin)
 */
export function calcImmediateDue(downPayment, dldFee, adminFee) {
  return downPayment + dldFee + adminFee;
}

/**
 * Calculate total outflow (net + DLD + admin)
 */
export function calcTotalOutflow(netPrice, dldFee, adminFee) {
  return netPrice + dldFee + adminFee;
}

/**
 * Calculate premium % between pre-launch and selling price
 */
export function calcPremium(sellingPrice, preLaunchPrice) {
  if (!preLaunchPrice || preLaunchPrice === 0) return 0;
  return ((sellingPrice - preLaunchPrice) / preLaunchPrice) * 100;
}

/**
 * Calculate collectible months between booking date and handover
 */
export function calcCollectibleMonths(bookingDate) {
  const book = new Date(bookingDate);
  let count = 0;
  let cur = new Date(book.getFullYear(), book.getMonth() + 1, 1);
  while (cur <= HANDOVER_DATE) {
    count++;
    cur.setMonth(cur.getMonth() + 1);
  }
  return count;
}

/**
 * Generate payment schedule rows
 */
export function generatePaymentSchedule(params) {
  const { netPrice, downPct, preSplitPct, bookingDate, dldFee, adminFee } = params;
  const book = new Date(bookingDate);
  const postPct = 100 - preSplitPct;
  
  // Month 12 date
  const month12Date = new Date(book);
  month12Date.setMonth(month12Date.getMonth() + 12);
  const month12Exceeds = month12Date > HANDOVER_DATE;
  const effectiveMonth12Date = month12Exceeds ? HANDOVER_DATE : month12Date;
  const month12Pct = month12Exceeds ? 0 : 10;
  
  const collectibleMonths = calcCollectibleMonths(bookingDate);
  // Bug #14 fixed: removed * 1 no-op, cap at collectibleMonths directly
  let preMonthlyPct = Math.max(0, preSplitPct - downPct - month12Pct);
  preMonthlyPct = Math.min(preMonthlyPct, collectibleMonths);
  let handoverPct = Math.max(0, preSplitPct - downPct - month12Pct - preMonthlyPct);
  
  const rows = [];
  
  // Booking deposit
  rows.push({
    id: 'booking',
    name: 'Booking (Down Payment)',
    date: book,
    percent: downPct,
    amount: netPrice * downPct / 100
  });
  
  // Month 12
  if (month12Pct > 0) {
    rows.push({
      id: 'month12',
      name: 'Month 12',
      date: effectiveMonth12Date,
      percent: month12Pct,
      amount: netPrice * month12Pct / 100
    });
  }
  
  // Pre-handover monthly
  if (preMonthlyPct > 0 && collectibleMonths > 0) {
    rows.push({
      id: 'preMonthly',
      name: `Pre-handover monthly (${collectibleMonths}×)`,
      date: null,
      dateLabel: 'Various',
      percent: preMonthlyPct,
      amount: netPrice * preMonthlyPct / 100,
      perMonth: (netPrice * preMonthlyPct / 100) / collectibleMonths,
      months: collectibleMonths
    });
  }
  
  // Handover
  if (handoverPct > 0) {
    rows.push({
      id: 'handover',
      name: 'Handover',
      date: HANDOVER_DATE,
      percent: handoverPct,
      amount: netPrice * handoverPct / 100
    });
  }
  
  // Post-handover
  if (postPct > 0) {
    rows.push({
      id: 'postHandover',
      name: `Post-handover (40×)`,
      date: null,
      dateLabel: '2029–2032',
      percent: postPct,
      amount: netPrice * postPct / 100,
      perMonth: (netPrice * postPct / 100) / 40,
      months: 40
    });
  }
  
  // DLD fee
  rows.push({
    id: 'dld',
    name: 'DLD / Oqood',
    date: book,
    dateLabel: 'Booking',
    percent: null,
    amount: dldFee
  });
  
  // Admin fee
  rows.push({
    id: 'admin',
    name: 'Admin Fee',
    date: book,
    dateLabel: 'Booking',
    percent: null,
    amount: adminFee
  });
  
  return {
    rows,
    collectibleMonths,
    month12Exceeds,
    effectiveMonth12Date,
    postPct,
    preMonthlyPct,
    month12Pct
  };
}

/**
 * Generate detailed monthly cashflow
 */
export function generateMonthlyCashflow(params) {
  const { netPrice, downPct, preSplitPct, bookingDate, dldFee, adminFee } = params;
  const book = new Date(bookingDate);
  const postPct = 100 - preSplitPct;
  
  const month12Date = new Date(book);
  month12Date.setMonth(month12Date.getMonth() + 12);
  const month12Exceeds = month12Date > HANDOVER_DATE;
  const effectiveMonth12Date = month12Exceeds ? HANDOVER_DATE : month12Date;
  const month12Pct = month12Exceeds ? 0 : 10;
  const collectibleMonths = calcCollectibleMonths(bookingDate);
  // Bug #14 fixed: removed * 1 no-op
  let preMonthlyPct = Math.max(0, preSplitPct - downPct - month12Pct);
  preMonthlyPct = Math.min(preMonthlyPct, collectibleMonths);
  
  const all = [];
  
  // Down payment
  all.push({ date: new Date(book), desc: 'Down payment', amount: netPrice * downPct / 100 });
  
  // Month 12
  if (month12Pct > 0) {
    all.push({ date: new Date(effectiveMonth12Date), desc: 'Month 12', amount: netPrice * month12Pct / 100 });
  }
  
  // Pre-handover monthly
  if (collectibleMonths > 0 && preMonthlyPct > 0) {
    const monthlyAmt = (netPrice * preMonthlyPct / 100) / collectibleMonths;
    let start = new Date(book.getFullYear(), book.getMonth() + 1, 1);
    let added = 0;
    let cur = new Date(start);
    while (added < collectibleMonths && cur <= HANDOVER_DATE) {
      const is12 = !month12Exceeds && cur.getFullYear() === effectiveMonth12Date.getFullYear() && cur.getMonth() === effectiveMonth12Date.getMonth();
      if (!is12) {
        all.push({ date: new Date(cur), desc: 'Pre-handover payment', amount: monthlyAmt });
        added++;
      }
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  
  // Handover
  let handoverPct = Math.max(0, preSplitPct - downPct - month12Pct - preMonthlyPct);
  if (handoverPct > 0) {
    all.push({ date: new Date(HANDOVER_DATE), desc: 'Handover', amount: netPrice * handoverPct / 100 });
  }
  
  // Post-handover
  if (postPct > 0) {
    const pm = (netPrice * postPct / 100) / 40;
    for (let i = 0; i < 40; i++) {
      let d = new Date(2029, 0, 1);
      d.setMonth(d.getMonth() + i);
      all.push({ date: d, desc: 'Post-handover payment', amount: pm });
    }
  }
  
  // DLD & Admin
  all.push({ date: new Date(book), desc: 'DLD/Oqood fee', amount: dldFee });
  all.push({ date: new Date(book), desc: 'Admin fee', amount: adminFee });
  
  all.sort((a, b) => a.date - b.date);
  
  return all;
}

/**
 * Generate annual outflow summary
 */
export function generateAnnualOutflow(cashflowItems, bookingDate) {
  const book = new Date(bookingDate);
  const yearly = new Map();
  
  cashflowItems.forEach(p => {
    if (p.date >= book) {
      const year = p.date.getFullYear();
      yearly.set(year, (yearly.get(year) || 0) + p.amount);
    }
  });
  
  const result = [];
  let cumulative = 0;
  const sortedYears = [...yearly.keys()].sort();
  const totalValue = [...yearly.values()].reduce((s, v) => s + v, 0);
  
  sortedYears.forEach(year => {
    const amount = yearly.get(year);
    cumulative += amount;
    result.push({
      year,
      percent: totalValue > 0 ? (amount / totalValue) * 100 : 0,
      amount,
      cumulative
    });
  });
  
  return result;
}

/**
 * Get approval status for discount
 * Bug #5 fixed: unknown roles now return an explicit error instead of silently denying.
 */
const VALID_ROLES = ['Sales Agent', 'Senior Agent', 'Manager', 'CEO'];

export function getApprovalStatus(discountPct, role) {
  if (!VALID_ROLES.includes(role)) {
    console.warn(`[getApprovalStatus] Unknown role: "${role}". Valid roles: ${VALID_ROLES.join(', ')}`);
    return { level: 'error', message: `Unknown role: "${role}"`, color: '#dc2626', bgColor: '#fee2e2' };
  }

  const ceilings = {
    'Sales Agent': 3,
    'Senior Agent': 5,
    'Manager': 8,
    'CEO': 15
  };
  
  const ceiling = ceilings[role];
  
  if (discountPct <= ceiling) {
    return { level: 'ok', message: '✓ Within authority — no approval needed', color: '#16a34a', bgColor: '#dcfce7' };
  }
  if (discountPct <= 5) {
    return { level: 'manager', message: '⚠ Manager approval required', color: '#ea580c', bgColor: '#fff7ed' };
  }
  if (discountPct <= 10) {
    return { level: 'ceo', message: '⚠ Requires CEO approval', color: '#dc2626', bgColor: '#fee2e2' };
  }
  return { level: 'board', message: '🔴 CEO approval required — Board flag', color: '#dc2626', bgColor: '#fee2e2' };
}
