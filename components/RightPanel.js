'use client';
import { formatAED, formatPct, formatDateLong } from '../lib/formatters';
import { generatePaymentSchedule, generateMonthlyCashflow, generateAnnualOutflow, HANDOVER_DATE } from '../lib/calculations';
import { exportSingleUnitCSV, exportBatchCSV, generateWhatsAppMessage } from '../lib/exportUtils';

export default function RightPanel({ unit, params, batchUnits, onOfferLetter }) {
  const { discount, dldPct, adminFee, downPct, preSplit, bookingDate, manualPrice } = params;
  const autoDisc = Math.max(0, Math.floor((downPct - 15) / 5) * 0.5);
  const totalDisc = discount + autoDisc;

  // Determine active units for right panel
  const activeUnits = batchUnits.length > 0 ? batchUnits : (unit ? [unit] : []);
  const isBatch = batchUnits.length > 0;

  if (!unit && batchUnits.length === 0) {
    return <div className="right-panel"><div className="card"><div className="card-body" style={{color:'var(--text-muted)',textAlign:'center',padding:'3rem'}}>Select a unit to begin</div></div></div>;
  }

  const basePrice = manualPrice > 0 ? manualPrice : (unit?.selling_price || 0);
  const totalBase = isBatch ? batchUnits.reduce((s,u)=>s+u.selling_price,0) : basePrice;
  const netPrice = totalBase * (1 - totalDisc / 100);
  const discAmt = totalBase - netPrice;
  const dldFee = netPrice * dldPct / 100;
  const downAmt = netPrice * downPct / 100;
  const adminTotal = (isBatch ? batchUnits.length : 1) * adminFee;
  const immediateDue = downAmt + dldFee + adminTotal;
  const totalOutflow = netPrice + dldFee + adminTotal;
  const totalArea = isBatch ? batchUnits.reduce((s,u)=>s+u.net_sqft,0) : (unit?.net_sqft || 1);
  const netPSF = totalArea > 0 ? netPrice / totalArea : 0;

  const schedResult = generatePaymentSchedule({ netPrice, downPct, preSplitPct: preSplit, bookingDate, dldFee, adminFee: adminTotal });
  const cashflow = generateMonthlyCashflow({ netPrice, downPct, preSplitPct: preSplit, bookingDate, dldFee, adminFee: adminTotal });
  const annualRows = generateAnnualOutflow(cashflow, bookingDate);

  const calcResults = { totalDiscountPct: totalDisc, discountAmount: discAmt, netPrice, netPSF, dldPct, dldFee, adminFee: adminTotal, downPct, downPayment: downAmt, immediateDue, totalOutflow, bookingDate, premiumPct: unit?.pre_launch_price>0?(((unit.selling_price-unit.pre_launch_price)/unit.pre_launch_price)*100).toFixed(1):0 };

  const handleExportCSV = () => {
    if (isBatch) {
      exportBatchCSV(batchUnits, (u) => {
        const net = u.selling_price * (1 - totalDisc / 100);
        const dld = net * dldPct / 100;
        const down = net * downPct / 100;
        return { totalDiscountPct: totalDisc, discountAmount: u.selling_price - net, netPrice: net, netPSF: net/u.net_sqft, dldPct, dldFee: dld, adminFee, downPct, downPayment: down, immediateDue: down+dld+adminFee, totalOutflow: net+dld+adminFee, bookingDate, premiumPct: 0 };
      });
    } else if (unit) {
      exportSingleUnitCSV(unit, calcResults);
    }
  };

  const handleWhatsApp = () => {
    if (!unit && batchUnits.length === 0) return;
    const msg = isBatch
      ? `ARY & MAZ Developments — Batch (${batchUnits.length} units)\nTotal Net Price: AED ${formatAED(netPrice)}\nImmediate Due: AED ${formatAED(immediateDue)}\nTotal Outflow: AED ${formatAED(totalOutflow)}`
      : generateWhatsAppMessage(unit, calcResults);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEmail = () => {
    if (!unit && batchUnits.length === 0) return;
    const body = isBatch
      ? `ARY & MAZ Developments — Batch (${batchUnits.length} units)\nTotal Net Price: AED ${formatAED(netPrice)}\nImmediate Due: AED ${formatAED(immediateDue)}\nTotal Outflow: AED ${formatAED(totalOutflow)}`
      : generateWhatsAppMessage(unit, calcResults);
    window.location.href = `mailto:?subject=ARY %26 MAZ Developments — Unit Offer&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="right-panel">
      {/* Financial Snapshot */}
      <div className="card">
        <div className="card-header">Financial Snapshot</div>
        <div className="card-body">
          <div className="snapshot-grid">
            <div className="snapshot-item"><div className="snapshot-label">Net Price to Customer</div><div className="snapshot-number">AED {formatAED(netPrice)}</div></div>
            <div className="snapshot-item"><div className="snapshot-label">Net Price per sqft</div><div className="snapshot-number">AED {formatAED(netPSF)}</div></div>
            <div className="snapshot-item"><div className="snapshot-label">DLD Fee ({formatPct(dldPct)})</div><div className="snapshot-number">AED {formatAED(dldFee)}</div></div>
            <div className="snapshot-item"><div className="snapshot-label">Admin Fee</div><div className="snapshot-number">AED {formatAED(adminTotal)}</div></div>
            <div className="snapshot-item highlight"><div className="snapshot-label">Immediate Due</div><div className="snapshot-number">AED {formatAED(immediateDue)}</div><div className="snapshot-sub">Down + DLD + Admin</div></div>
            <div className="snapshot-item"><div className="snapshot-label">Total Outflow</div><div className="snapshot-number">AED {formatAED(totalOutflow)}</div><div className="snapshot-sub">Net + DLD + Admin</div></div>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      {!isBatch && unit && (
        <div className="card">
          <div className="card-header">Price Breakdown</div>
          <div className="card-body" style={{padding:0}}>
            <table className="payment-table">
              <thead><tr><th>Component</th><th className="amount-col">sqft</th><th className="amount-col">Rate (AED)</th><th className="amount-col">Amount (AED)</th></tr></thead>
              <tbody>
                <tr><td>Internal Area</td><td className="amount-col">{unit.internal_sqft?.toFixed(2)}</td><td className="amount-col">{formatAED(unit.rate)}</td><td className="amount-col">{formatAED(unit.internal_sqft*unit.rate)}</td></tr>
                <tr><td>Balcony Area</td><td className="amount-col">{unit.balcony_sqft?.toFixed(2)||'—'}</td><td className="amount-col">{formatAED(unit.rate*0.25)}</td><td className="amount-col">{formatAED((unit.balcony_sqft||0)*unit.rate*0.25)}</td></tr>
                <tr className="total-row"><td><strong>Net Unit Price</strong></td><td className="amount-col">{unit.net_sqft?.toFixed(2)}</td><td className="amount-col"></td><td className="amount-col"><strong>{formatAED(unit.selling_price)}</strong></td></tr>
                {totalDisc > 0 && <tr style={{color:'var(--danger)'}}><td>Discount ({formatPct(totalDisc)})</td><td/><td/><td className="amount-col">-{formatAED(discAmt)}</td></tr>}
                <tr className="total-row"><td><strong>Net Price to Customer</strong></td><td/><td/><td className="amount-col"><strong>{formatAED(netPrice)}</strong></td></tr>
                <tr><td>DLD / Oqood ({formatPct(dldPct)})</td><td/><td/><td className="amount-col">{formatAED(dldFee)}</td></tr>
                <tr><td>Admin Fee</td><td/><td/><td className="amount-col">{formatAED(adminTotal)}</td></tr>
                <tr className="total-row"><td><strong>Total Outflow</strong></td><td/><td/><td className="amount-col"><strong>{formatAED(totalOutflow)}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pre-launch comparison */}
      {!isBatch && unit && (
        <div className="card">
          <div className="card-header">Pre-Launch vs Current</div>
          <div className="card-body">
            <div className="prelaunch-box">
              <div className="pl-row"><span className="pl-label">Pre-launch price</span><span className="pl-value">AED {formatAED(unit.pre_launch_price)}</span></div>
              <div className="pl-row"><span className="pl-label">Current selling price</span><span className="pl-value">AED {formatAED(unit.selling_price)}</span></div>
              <div className="pl-row"><span className="pl-label">Premium above pre-launch</span><span className="pl-value" style={{color:'#16a34a'}}>+{unit.pre_launch_price>0?(((unit.selling_price-unit.pre_launch_price)/unit.pre_launch_price)*100).toFixed(1):0}%  (AED {formatAED(unit.selling_price-unit.pre_launch_price)})</span></div>
              <div className="pl-row"><span className="pl-label">Net price after discount</span><span className="pl-value">AED {formatAED(netPrice)}</span></div>
              <div className="pl-row"><span className="pl-label">Effective discount from pre-launch</span><span className="pl-value">{unit.pre_launch_price>0?formatPct(((unit.pre_launch_price-netPrice)/unit.pre_launch_price)*100):'—'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Schedule */}
      <div className="card">
        <div className="card-header">Payment Schedule</div>
        <div className="card-body" style={{padding:0}}>
          <table className="payment-table">
            <thead><tr><th>Stage</th><th>Due Date</th><th className="amount-col">% of Net</th><th className="amount-col">Amount (AED)</th></tr></thead>
            <tbody>
              {schedResult.rows.map((r,i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>{r.dateLabel || (r.date ? formatDateLong(r.date) : '—')}</td>
                  <td className="amount-col">{r.percent !== null ? formatPct(r.percent) : '—'}</td>
                  <td className="amount-col">{formatAED(r.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row"><td colSpan="2"><strong>Total</strong></td><td className="amount-col"><strong>100%</strong></td><td className="amount-col"><strong>{formatAED(netPrice)}</strong></td></tr>
              <tr className="total-row"><td colSpan="3"><strong>Total Outflow (incl. fees)</strong></td><td className="amount-col"><strong>{formatAED(totalOutflow)}</strong></td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Monthly Cashflow */}
      <div className="card">
        <div className="card-header">Monthly Cashflow</div>
        <div className="card-body" style={{padding:0}}>
          <div className="scrollable-table">
            <table className="payment-table">
              <thead><tr><th>Date</th><th>Description</th><th className="amount-col">% of Net</th><th className="amount-col">Amount</th><th className="amount-col">Cumulative</th></tr></thead>
              <tbody>
                {(() => { let cum = 0; return cashflow.map((p,i) => { cum += p.amount; return (
                  <tr key={i}><td>{formatDateLong(p.date)}</td><td>{p.desc}</td><td className="amount-col">{(p.amount/netPrice*100).toFixed(1)}%</td><td className="amount-col">{formatAED(p.amount)}</td><td className="amount-col">{formatAED(cum)}</td></tr>
                );})})()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Annual Outflow */}
      <div className="card">
        <div className="card-header">Annual Cash Outflow</div>
        <div className="card-body" style={{padding:0}}>
          <div className="scrollable-table">
            <table className="payment-table">
              <thead><tr><th>Year</th><th className="amount-col">% of Total</th><th className="amount-col">Amount (AED)</th><th className="amount-col">Cumulative</th></tr></thead>
              <tbody>
                {annualRows.map(r=>(
                  <tr key={r.year}><td>{r.year}</td><td className="amount-col">{formatPct(r.percent)}</td><td className="amount-col">{formatAED(r.amount)}</td><td className="amount-col">{formatAED(r.cumulative)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Policy & Benchmarks */}
      <div className="card">
        <div className="card-header">Policy &amp; Benchmarks</div>
        <div className="card-body">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div>
              <div className="param-row"><span className="label">Support cap</span><span>10.0%</span></div>
              <div className="param-row"><span className="label">Discount used</span><span>{formatPct(totalDisc)}</span></div>
              <div className="param-row"><span className="label">DLD/Oqood used</span><span>{formatPct(dldPct)}</span></div>
              <div className="param-row"><span className="label">Remaining support</span><span>{formatPct(Math.max(0,10-totalDisc))}</span></div>
              <div style={{marginTop:'0.6rem'}}>
                <span style={{background: totalDisc>10?'var(--danger-light)':totalDisc>5?'#fff7ed':'#f0fdf4', color: totalDisc>10?'var(--danger)':totalDisc>5?'#c2410c':'#166534', padding:'0.2rem 0.75rem', borderRadius:'2rem', fontSize:'0.68rem', fontWeight:600}}>
                  {totalDisc > 10 ? '⚠ CEO Approval Required' : totalDisc > 5 ? '⚠ Manager Approval Required' : '✓ Within Policy'}
                </span>
              </div>
            </div>
            <table className="payment-table" style={{fontSize:'0.7rem'}}>
              <thead><tr><th>Parameter</th><th className="amount-col">Standard</th><th className="amount-col">Current</th></tr></thead>
              <tbody>
                <tr><td>Down Payment</td><td className="amount-col">15%</td><td className="amount-col">{formatPct(downPct)}</td></tr>
                <tr><td>Discount</td><td className="amount-col">0%</td><td className="amount-col">{formatPct(totalDisc)}</td></tr>
                <tr><td>DLD/Oqood</td><td className="amount-col">4%</td><td className="amount-col">{formatPct(dldPct)}</td></tr>
                <tr><td>Immediate Due</td><td className="amount-col">—</td><td className="amount-col">{formatAED(immediateDue)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar no-print">
        <button className="outline" onClick={handleWhatsApp}>📱 WhatsApp</button>
        <button className="outline" onClick={handleEmail}>✉ Email</button>
        <button style={{background:'#1a2a3a',color:'white'}} onClick={onOfferLetter}>📄 Offer Letter</button>
        <button className="outline" onClick={handleExportCSV}>Export CSV</button>
        <button className="outline" onClick={()=>window.print()}>🖨 Print</button>
      </div>
    </div>
  );
}
