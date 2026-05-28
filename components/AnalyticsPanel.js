'use client';
import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatAED, formatPct } from '../lib/formatters';
import { generateMonthlyCashflow, generateAnnualOutflow } from '../lib/calculations';
import { useTheme } from '../context/ThemeContext';

const GOLD = '#c9a84c';
const GOLD2 = '#e8c47a';
const TEAL = '#22d3ee';
const RED = '#ef4444';
const GREEN = '#22c55e';
const PURPLE = '#a855f7';
const BLUE = '#3b82f6';

const COLORS = [GOLD, TEAL, GREEN, PURPLE, BLUE, RED, GOLD2];

// Custom tooltip matching current theme
function DarkTooltip({ active, payload, label, prefix = 'AED ', pct = false }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'var(--card-input-bg)', border:'1px solid var(--border)', borderRadius:'0.6rem',
      padding:'0.65rem 0.9rem', fontSize:'0.72rem', color:'var(--text-primary)',
      boxShadow:'0 8px 24px rgba(0,0,0,0.5)'
    }}>
      <div style={{color:'var(--text-muted)', marginBottom:'0.35rem', fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{display:'flex', gap:'0.5rem', alignItems:'center', marginBottom:'0.15rem'}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:p.color || p.fill,flexShrink:0}}/>
          <span style={{color:'var(--text-muted)'}}>{p.name}:</span>
          <span style={{fontWeight:700, color:'var(--accent)'}}>
            {pct ? formatPct(p.value) : `${prefix}${formatAED(p.value)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPanel({ unit, params, batchUnits, inventory }) {
  const [activeChart, setActiveChart] = useState('cashflow');
  const { theme } = useTheme();

  const { discount, dldPct, adminFee, downPct, preSplit, bookingDate, manualPrice } = params;
  const autoDisc = Math.max(0, Math.floor((downPct - 15) / 5) * 0.5);
  const totalDisc = discount + autoDisc;

  const activeUnits = batchUnits.length > 0 ? batchUnits : (unit ? [unit] : []);
  const totalBase = activeUnits.reduce((s, u) => s + (u.selling_price || 0), 0) || (manualPrice > 0 ? manualPrice : 0);
  const netPrice = totalBase * (1 - totalDisc / 100);
  const dldFee = netPrice * dldPct / 100;
  const adminTotal = (activeUnits.length || 1) * adminFee;

  // ── 1. Monthly cashflow chart data ──
  const cashflow = useMemo(() => {
    if (!netPrice) return [];
    return generateMonthlyCashflow({ netPrice, downPct, preSplitPct: preSplit, bookingDate, dldFee, adminFee: adminTotal });
  }, [netPrice, downPct, preSplit, bookingDate, dldFee, adminTotal]);

  const cashflowChartData = useMemo(() => {
    let cumulative = 0;
    return cashflow.map(p => {
      cumulative += p.amount;
      const d = new Date(p.date);
      return {
        month: d.toLocaleDateString('en-AE', { month: 'short', year: '2-digit' }),
        amount: Math.round(p.amount),
        cumulative: Math.round(cumulative),
        label: p.desc,
      };
    });
  }, [cashflow]);

  // ── 2. Annual outflow chart data ──
  const annualRows = useMemo(() => generateAnnualOutflow(cashflow, bookingDate), [cashflow, bookingDate]);
  const annualChartData = annualRows.map(r => ({ year: String(r.year), amount: Math.round(r.amount), pct: parseFloat(r.percent.toFixed(1)) }));

  // ── 3. Price composition donut ──
  const priceDonutData = netPrice > 0 ? [
    { name: 'Net Price', value: Math.round(netPrice) },
    { name: 'DLD Fee', value: Math.round(dldFee) },
    { name: 'Admin Fee', value: Math.round(adminTotal) },
  ] : [];

  // ── 4. Inventory status breakdown (from all units) ──
  const inventoryStats = useMemo(() => {
    if (!inventory?.length) return [];
    const counts = {};
    inventory.forEach(u => {
      const s = u.status === 'Booked - Pending Payment Confirmation' ? 'Booked' : (u.status || 'Unknown');
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  // ── 5. Bedroom type distribution ──
  const typeDistribution = useMemo(() => {
    if (!inventory?.length) return [];
    const counts = {};
    inventory.forEach(u => { const t = u.bedrooms || 'Shop'; counts[t] = (counts[t] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  // ── 6. Price-per-sqft by type ──
  const psfByType = useMemo(() => {
    if (!inventory?.length) return [];
    const groups = {};
    inventory.forEach(u => {
      const t = u.bedrooms || 'Shop';
      if (!groups[t]) groups[t] = { sum: 0, count: 0 };
      groups[t].sum += u.rate || 0;
      groups[t].count++;
    });
    return Object.entries(groups).map(([type, d]) => ({ type, avgPSF: Math.round(d.sum / d.count) }));
  }, [inventory]);

  // ── 7. Discount sensitivity ──
  const discountSensitivity = useMemo(() => {
    if (!totalBase) return [];
    return [0, 2, 4, 6, 8, 10, 12, 15].map(d => ({
      discount: `${d}%`,
      netPrice: Math.round(totalBase * (1 - d / 100)),
      saving: Math.round(totalBase * d / 100),
    }));
  }, [totalBase]);

  // ── 8. Batch unit comparison ──
  const batchComparison = batchUnits.map(u => ({
    unit: u.unit_no,
    price: Math.round(u.selling_price),
    net: Math.round(u.selling_price * (1 - totalDisc / 100)),
    area: Math.round(u.net_sqft),
    psf: Math.round(u.rate),
  }));

  const charts = [
    { id: 'cashflow', label: 'Cashflow' },
    { id: 'annual', label: 'Annual Outflow' },
    { id: 'composition', label: 'Cost Breakdown' },
    { id: 'inventory', label: 'Inventory Mix' },
    { id: 'psf', label: 'Price per sqft' },
    { id: 'sensitivity', label: 'Discount Impact' },
    ...(batchUnits.length > 1 ? [{ id: 'batch', label: 'Batch Comparison' }] : []),
  ];

  const axisStyle = { fill: theme.textMuted, fontSize: 10 };
  const gridStyle = { stroke: theme.divider, strokeDasharray: '3 3' };

  const renderChart = () => {
    switch (activeChart) {
      case 'cashflow':
        return (
          <div>
            <div className="chart-description">Monthly cashflow timeline showing every payment milestone from booking through post-handover.</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={cashflowChartData} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="month" tick={{ ...axisStyle }} angle={-40} textAnchor="end" interval="preserveStartEnd" minTickGap={15} height={60} />
                <YAxis tick={{ ...axisStyle }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} width={35} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.65rem', color: theme.textMuted }} />
                <Bar dataKey="amount" name="Payment" fill={GOLD} radius={[3, 3, 0, 0]} opacity={0.85} />
                <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke={TEAL} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'annual':
        return (
          <div>
            <div className="chart-description">Total cash outflow grouped by calendar year — shows how payments are distributed across the payment period.</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={annualChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="year" tick={{ ...axisStyle }} />
                <YAxis yAxisId="amt" tick={{ ...axisStyle }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} width={35} />
                <YAxis yAxisId="pct" orientation="right" tick={{ ...axisStyle }} tickFormatter={v => `${v}%`} width={30} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.65rem', color: theme.textMuted }} />
                <Bar yAxisId="amt" dataKey="amount" name="Amount" fill={GOLD} radius={[4, 4, 0, 0]}>
                  {annualChartData.map((_, i) => <Cell key={i} fill={i === 0 ? GOLD : i === 1 ? GOLD2 : TEAL} />)}
                </Bar>
                <Line yAxisId="pct" type="monotone" dataKey="pct" name="% of Total" stroke={GREEN} strokeWidth={2} dot={{ fill: GREEN, r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'composition':
        return (
          <div>
            <div className="chart-description">Breakdown of the total deal cost: net unit price, DLD/Oqood fee, and administrative charges.</div>
            {priceDonutData.length > 0 ? (
              <div className="chart-flex-container">
                <div className="donut-wrapper">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={priceDonutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {priceDonutData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<DarkTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, width: '100%' }}>
                  {priceDonutData.map((d, i) => {
                    const total = priceDonutData.reduce((s, x) => s + x.value, 0);
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: `1px solid ${theme.divider}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i] }} />
                          <span style={{ fontSize: '0.73rem', color: theme.textPrimary }}>{d.name}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: COLORS[i] }}>AED {formatAED(d.value)}</div>
                          <div style={{ fontSize: '0.6rem', color: theme.textMuted }}>{((d.value / total) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <div style={{ color: theme.textMuted, textAlign: 'center', padding: '3rem' }}>Select a unit to see cost breakdown</div>}
          </div>
        );

      case 'inventory':
        return (
          <div>
            <div className="chart-description">Live inventory availability across all 226 units — shows sold, available, blocked, held, and booked ratios.</div>
            <div className="chart-flex-container">
              <div className="donut-wrapper">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={inventoryStats} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {inventoryStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<DarkTooltip prefix="" pct={false} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, width: '100%' }}>
                {inventoryStats.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: `1px solid ${theme.divider}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                      <span style={{ fontSize: '0.72rem', color: theme.textPrimary }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: COLORS[i % COLORS.length] }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '1.2rem' }}>
              <div style={{ fontSize: '0.63rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Units by Bedroom Type</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={typeDistribution} margin={{ top: 2, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid {...gridStyle} />
                  <XAxis dataKey="name" tick={{ ...axisStyle }} />
                  <YAxis tick={{ ...axisStyle }} width={25} />
                  <Tooltip content={<DarkTooltip prefix="" />} />
                  <Bar dataKey="value" name="Units" radius={[3, 3, 0, 0]}>
                    {typeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'psf':
        return (
          <div>
            <div className="chart-description">Average price per square foot comparison across all bedroom types — helps identify premium vs value tiers.</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={psfByType} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid {...gridStyle} horizontal={false} />
                <XAxis type="number" tick={{ ...axisStyle }} tickFormatter={v => `${v.toLocaleString()}`} />
                <YAxis dataKey="type" type="category" tick={{ ...axisStyle }} width={60} />
                <Tooltip content={<DarkTooltip prefix="AED " />} />
                <Bar dataKey="avgPSF" name="Avg AED/sqft" radius={[0, 4, 4, 0]}>
                  {psfByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'sensitivity':
        return (
          <div>
            <div className="chart-description">How different discount levels impact net selling price — use this to understand margin erosion at each approval threshold.</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={discountSensitivity} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="discount" tick={{ ...axisStyle }} />
                <YAxis yAxisId="net" tick={{ ...axisStyle }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="sav" orientation="right" tick={{ ...axisStyle }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.65rem', color: theme.textMuted }} />
                <Area yAxisId="net" type="monotone" dataKey="netPrice" name="Net Price" fill="#2a2416" stroke={GOLD} strokeWidth={2} />
                <Bar yAxisId="sav" dataKey="saving" name="Discount Saving" fill={RED} radius={[3, 3, 0, 0]} opacity={0.7} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.4rem', marginTop: '0.75rem' }}>
              {[['0–3%', 'Sales Agent', '#22c55e'], ['3–5%', 'Sr. Agent', GOLD], ['5–8%', 'Manager', '#f97316'], ['8–10%', 'Director', RED], ['>10%', 'CEO Only', '#ef4444']].map(([range, role, color]) => (
                <div key={range} style={{ background: theme.cardInputBg, borderRadius: '0.5rem', padding: '0.4rem 0.6rem', border: `1px solid ${color}22` }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color }}>{range}</div>
                  <div style={{ fontSize: '0.6rem', color: theme.textMuted }}>{role}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'batch':
        return (
          <div>
            <div className="chart-description">Side-by-side comparison of all units in the current batch — price, net price after discount, and area.</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={batchComparison} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="unit" tick={{ ...axisStyle }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ ...axisStyle }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.65rem', color: theme.textMuted }} />
                <Bar dataKey="price" name="Selling Price" fill={GOLD2} radius={[3, 3, 0, 0]} opacity={0.6} />
                <Bar dataKey="net" name={`Net (${formatPct(totalDisc)} disc)`} fill={GOLD} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="card-header" style={{ fontSize: '0.65rem', letterSpacing: '0.8px' }}>
        Analytics &amp; Insights
      </div>
      <div className="card-body" style={{ padding: '0.75rem 1rem 1rem' }}>
        {/* Chart selector tabs */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '1rem', borderBottom: `1px solid ${theme.divider}`, paddingBottom: '0.6rem' }}>
          {charts.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChart(c.id)}
              style={{
                background: activeChart === c.id ? theme.accent : theme.cardInputBg,
                color: activeChart === c.id ? theme.btnPrimaryText : theme.textMuted,
                border: `1px solid ${activeChart === c.id ? theme.accent : theme.border}`,
                borderRadius: '0.4rem', padding: '0.3rem 0.65rem', fontSize: '0.65rem',
                fontWeight: activeChart === c.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{c.label}</button>
          ))}
        </div>
        {renderChart()}
      </div>
    </div>
  );
}
