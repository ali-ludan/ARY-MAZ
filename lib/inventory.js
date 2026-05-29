// Pure utility — no React dependencies. Do NOT add 'use client' here.

export function parseCSVRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (c === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += c;
  }
  result.push(current.trim());
  return result;
}

export function parseInventoryCSV(csvText) {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const units = [];
  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVRow(line);
    if (cols.length < 9) continue;
    const unit_no = cols[1]?.trim();
    if (!unit_no) continue;
    const bedrooms = cols[2]?.trim() || null;
    const status = cols[3]?.trim() || '';
    const internal_sqft = parseFloat(cols[4]) || 0;
    const balcony_sqft = parseFloat(cols[5]) || 0;
    const net_sqft = parseFloat(cols[6]) || 0;
    const rate = parseFloat(cols[7]) || 0;
    const selling_price = parseFloat(cols[8]) || 0;
    const pre_launch_price = parseFloat(cols[9]) || 0;
    const floor_plan_url = cols[10]?.trim() || '';
    // Skip test unit
    if (unit_no === 'test') continue;
    units.push({
      unit_no,
      bedrooms,
      status,
      internal_sqft,
      balcony_sqft,
      net_sqft,
      rate,
      selling_price,
      pre_launch_price,
      floor_plan_url,
    });
  }
  return units;
}

export function computeStats(units) {
  const total = units.length;
  const available = units.filter(u => u.status === 'Available').length;
  const blocked = units.filter(u => u.status === 'Blocked').length;
  const hold = units.filter(u => u.status === 'Hold').length;
  const booked = units.filter(u => u.status === 'Booked - Pending Payment Confirmation').length;
  const sold = units.filter(u => u.status === 'Sold').length;
  const totalValue = units.reduce((s, u) => s + u.selling_price, 0);
  const totalPreLaunch = units.reduce((s, u) => s + u.pre_launch_price, 0);
  return { total, available, blocked, hold, booked, sold, totalValue, totalPreLaunch };
}

export function filterUnits(units, typeFilter, statusFilter) {
  let filtered = [...units];
  if (typeFilter && typeFilter !== 'ALL') {
    filtered = filtered.filter(u => u.bedrooms === typeFilter);
  }
  if (statusFilter && statusFilter !== 'ALL') {
    if (statusFilter === 'Booked') {
      filtered = filtered.filter(u => u.status === 'Booked - Pending Payment Confirmation');
    } else {
      filtered = filtered.filter(u => u.status === statusFilter);
    }
  }
  return filtered;
}
