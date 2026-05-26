'use client';
import { useRef, useState, useEffect } from 'react';
import { formatAED, formatPct, formatDateLong } from '../lib/formatters';

let offerRefCounter = 1;

export default function OfferModal({ open, onClose, units, params }) {
  const [customerName, setCustomerName] = useState('');
  const overlayRef = useRef(null);

  const refNum = `AM-${new Date().getFullYear()}-${String(offerRefCounter).padStart(3,'0')}`;
  const today = formatDateLong(new Date());

  if (!open || !units || units.length === 0) return null;

  const { discountPct, dldPct, adminFee, downPct } = params;

  const rows = units.map((u, i) => {
    const selling = u.overridePrice || u.selling_price;
    const discAmt = selling * (discountPct / 100);
    const net = selling - discAmt;
    const netPSF = u.net_sqft > 0 ? net / u.net_sqft : 0;
    const dld = net * (dldPct / 100);
    const down = net * (downPct / 100);
    const imm = down + dld + adminFee;
    return { idx: i+1, unit_no: u.unit_no, type: u.bedrooms||'—', net_sqft: u.net_sqft,
      rate: u.rate, selling, discPct: discountPct, discAmt, net, netPSF, dld, admin: adminFee, down, imm };
  });

  const totNet = rows.reduce((s,r) => s+r.net, 0);
  const totDld = rows.reduce((s,r) => s+r.dld, 0);
  const totAdmin = rows.reduce((s,r) => s+r.admin, 0);
  const totDown = rows.reduce((s,r) => s+r.down, 0);
  const totImm = rows.reduce((s,r) => s+r.imm, 0);
  const totOutflow = totNet + totDld + totAdmin;

  return (
    <div className="offer-overlay open" ref={overlayRef} onClick={e => { if(e.target===overlayRef.current) onClose(); }}>
      <div className="offer-modal">
        <div className="offer-modal-header">
          <div className="offer-brand">
            <div className="logo">ARY &amp; <span>MAZ</span> Developments</div>
            <div className="sub">Premium Residences · Dubai, UAE</div>
          </div>
          <div className="offer-badge">📋 Offer Letter</div>
          <div className="offer-meta">
            <div><strong>Date</strong> {today}</div>
            <div><strong>Reference</strong> {refNum}</div>
          </div>
        </div>
        <div className="offer-body">
          <div className="customer-line">
            <span className="customer-label">Prepared for</span>
            <input className="name-input" placeholder="Enter customer name" value={customerName} onChange={e=>setCustomerName(e.target.value)} />
          </div>
          <div className="offer-table-wrap">
            <table className="offer-table">
              <thead><tr>
                <th>#</th><th>Unit</th><th>Type</th>
                <th className="amount-col">Net sqft</th>
                <th className="amount-col">Rate/sqft</th>
                <th className="amount-col">Selling Price</th>
                <th className="amount-col">Disc %</th>
                <th className="amount-col">Disc Amt</th>
                <th className="amount-col">Net Price</th>
                <th className="amount-col">DLD</th>
                <th className="amount-col">Admin</th>
                <th className="amount-col">Down Pmt</th>
                <th className="amount-col">Imm. Due</th>
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.idx}>
                    <td>{r.idx}</td>
                    <td><strong>{r.unit_no}</strong></td>
                    <td>{r.type}</td>
                    <td className="amount-col">{r.net_sqft?.toFixed(2)}</td>
                    <td className="amount-col">{formatAED(r.rate)}</td>
                    <td className="amount-col">{formatAED(r.selling)}</td>
                    <td className="amount-col">{formatPct(r.discPct)}</td>
                    <td className="amount-col">{formatAED(r.discAmt)}</td>
                    <td className="amount-col"><strong>{formatAED(r.net)}</strong></td>
                    <td className="amount-col">{formatAED(r.dld)}</td>
                    <td className="amount-col">{formatAED(r.admin)}</td>
                    <td className="amount-col">{formatAED(r.down)}</td>
                    <td className="amount-col">{formatAED(r.imm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="offer-summary-grid">
            <div className="offer-summary-card gold"><div className="num">{formatAED(totNet)}</div><div className="lbl">Total Net Price (AED)</div></div>
            <div className="offer-summary-card"><div className="num">{formatAED(totDld)}</div><div className="lbl">Total DLD</div></div>
            <div className="offer-summary-card"><div className="num">{formatAED(totAdmin)}</div><div className="lbl">Total Admin</div></div>
            <div className="offer-summary-card"><div className="num">{formatAED(totDown)}</div><div className="lbl">Total Down Payment</div></div>
            <div className="offer-summary-card dark"><div className="num">{formatAED(totImm)}</div><div className="lbl">Immediate Due</div></div>
            <div className="offer-summary-card dark"><div className="num">{formatAED(totOutflow)}</div><div className="lbl">Total Outflow</div></div>
          </div>
          <div className="offer-footer-note">
            Prices in AED. DLD at {formatPct(dldPct)}. Admin fee AED {formatAED(adminFee)} per unit. Offer valid 7 days. Subject to availability.
          </div>
          <div className="offer-modal-footer no-print">
            <button className="outline" onClick={onClose}>✕ Close</button>
            <button style={{background:'#1a2a3a',color:'white'}} onClick={() => window.print()}>🖨 Print</button>
          </div>
        </div>
      </div>
    </div>
  );
}
