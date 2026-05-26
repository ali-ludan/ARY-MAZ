'use client';
import { useState } from 'react';
import { formatAED, formatPct } from '../lib/formatters';
import { getApprovalStatus } from '../lib/calculations';

const ROLE_CEILINGS = { 'Sales Agent': 3, 'Senior Agent': 5, 'Manager': 8, 'CEO': 15 };

export default function Module3({ units }) {
  return <Module3Inner units={units} />;
}


export function Module3Inner({ units }) {
  const [selIdx, setSelIdx] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [role, setRole] = useState('Sales Agent');

  const unit = units[selIdx] || units[0];
  if (!unit) return <div className="card"><div className="card-body">No units loaded.</div></div>;

  const selling = unit.selling_price;
  const preLaunch = unit.pre_launch_price;
  const buffer = selling - preLaunch;
  const discAmt = selling * (discountPct / 100);
  const netPrice = selling - discAmt;
  const remainingBuffer = netPrice - preLaunch;
  const bufferConsumed = buffer > 0 ? (discAmt / buffer) * 100 : 0;
  const approval = getApprovalStatus(discountPct, role);
  const ceiling = ROLE_CEILINGS[role] || 0;

  const copyText = [
    `Unit: ${unit.unit_no} | Type: ${unit.bedrooms||'N/A'} | Size: ${unit.net_sqft} sqft`,
    `Selling Price: AED ${formatAED(selling)}`,
    `Requested Discount: ${formatPct(discountPct)} = AED ${formatAED(discAmt)}`,
    `Net Price: AED ${formatAED(netPrice)}`,
    `Requested by: ${role}`,
    `Requires: ${discountPct > ceiling ? (discountPct > 8 ? 'CEO' : 'Manager') : 'No'} approval`
  ].join('\n');

  return (
    <div className="two-columns">
      <div className="left-panel">
        <div className="card">
          <div className="card-header">Discount Impact — Inputs</div>
          <div className="card-body">
            <div className="filter-label">Select Unit</div>
            <select className="unit-select" value={selIdx} onChange={e=>setSelIdx(+e.target.value)}>
              {units.map((u,i) => (
                <option key={u.unit_no} value={i}>{u.unit_no} — {u.bedrooms||'Shop'} — {u.status}</option>
              ))}
            </select>
            <div className="detail-grid" style={{marginTop:'0.8rem'}}>
              <div className="detail-item"><div className="detail-label">Selling Price</div><div className="detail-value">AED {formatAED(selling)}</div></div>
              <div className="detail-item"><div className="detail-label">Pre-Launch Price</div><div className="detail-value">AED {formatAED(preLaunch)}</div></div>
              <div className="detail-item"><div className="detail-label">Buffer (10%)</div><div className="detail-value">AED {formatAED(buffer)}</div></div>
              <div className="detail-item"><div className="detail-label">Net sqft</div><div className="detail-value">{unit.net_sqft?.toFixed(2)}</div></div>
            </div>
            <div className="divider"/>
            <div className="slider-group">
              <div className="slider-header">
                <span>Requested Discount</span>
                <span className="slider-value">{formatPct(discountPct)}</span>
              </div>
              <input type="range" min="0" max="20" step="0.1" value={discountPct} onChange={e=>setDiscountPct(+e.target.value)}/>
              <div className="fee-badge">Discount amount: AED {formatAED(discAmt)}</div>
            </div>
            <div className="filter-label" style={{marginTop:'0.8rem'}}>Agent Role</div>
            <select className="unit-select" value={role} onChange={e=>setRole(e.target.value)}>
              {Object.keys(ROLE_CEILINGS).map(r => <option key={r}>{r}</option>)}
            </select>
            <div className="metric-highlight" style={{marginTop:'0.8rem'}}>
              <div className="param-row"><span className="label">Authority ceiling</span><span style={{fontWeight:600}}>{ceiling}%</span></div>
              <div className="param-row"><span className="label">Requested discount</span><span>{formatPct(discountPct)}</span></div>
              <div className="param-row"><span className="label">Status</span>
                <span style={{color: approval.color, fontWeight:600}}>{discountPct <= ceiling ? '✓ Within' : '⚠ Exceeds'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="right-panel">
        <div className="card">
          <div className="card-header">Margin Impact</div>
          <div className="card-body">
            <table className="payment-table">
              <thead><tr><th>Metric</th><th className="amount-col">Amount (AED)</th><th className="amount-col">Per sqft</th></tr></thead>
              <tbody>
                <tr><td>Selling Price (base)</td><td className="amount-col">{formatAED(selling)}</td><td className="amount-col">{formatAED(unit.rate)}</td></tr>
                <tr><td>Pre-Launch Price</td><td className="amount-col">{formatAED(preLaunch)}</td><td className="amount-col">{formatAED(preLaunch/unit.net_sqft)}</td></tr>
                <tr><td>Buffer above pre-launch (10%)</td><td className="amount-col">{formatAED(buffer)}</td><td className="amount-col">{formatAED(buffer/unit.net_sqft)}</td></tr>
                <tr style={{color:'var(--danger)'}}><td>Requested discount ({formatPct(discountPct)})</td><td className="amount-col">-{formatAED(discAmt)}</td><td className="amount-col">-{formatAED(discAmt/unit.net_sqft)}</td></tr>
                <tr className="total-row"><td><strong>Net Price after discount</strong></td><td className="amount-col"><strong>{formatAED(netPrice)}</strong></td><td className="amount-col"><strong>{formatAED(netPrice/unit.net_sqft)}</strong></td></tr>
                <tr><td>Remaining buffer above pre-launch</td><td className="amount-col">{formatAED(remainingBuffer)}</td><td className="amount-col">{formatAED(remainingBuffer/unit.net_sqft)}</td></tr>
                <tr><td>Buffer consumed</td><td className="amount-col">{formatPct(bufferConsumed)}</td><td className="amount-col">—</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header">Approval Status</div>
          <div className="card-body">
            <div className="approval-panel" style={{borderColor: approval.color, background: approval.bgColor}}>
              <div className="approval-msg" style={{color: approval.color}}>{approval.message}</div>
            </div>
            <div className="filter-label" style={{marginTop:'1rem'}}>Approval Summary (copy to WhatsApp)</div>
            <div className="approval-copy">{copyText}</div>
            <button className="outline" style={{marginTop:'0.5rem'}} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(copyText)}`,'_blank')}>
              📱 Copy to WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
