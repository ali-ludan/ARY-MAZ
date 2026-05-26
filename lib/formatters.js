// ========== FORMATTING UTILITIES ==========

export function formatAED(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return Math.round(value).toLocaleString('en-US');
}

export function formatPct(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return value.toFixed(1) + '%';
}

export function formatSqft(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return value.toFixed(2);
}

export function formatDateLong(date) {
  if (!date) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateISO(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getStatusColor(status) {
  if (!status) return '#64748b';
  const s = status.toLowerCase();
  if (s === 'available') return '#16a34a';
  if (s === 'sold') return '#dc2626';
  if (s === 'blocked' || s === 'hold') return '#ea580c';
  if (s.includes('booked')) return '#2563eb';
  return '#64748b';
}

export function getStatusDot(status) {
  const color = getStatusColor(status);
  return { color, label: status || '—' };
}
