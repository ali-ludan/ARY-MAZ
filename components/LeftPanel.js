'use client';
import { formatAED, formatPct, formatDateLong, getStatusColor } from '../lib/formatters';
import { calcAutoDiscount } from '../lib/calculations';

const TYPES = ['ALL','STUDIO','1 BR','2 BR','3 BR DU PH'];
const STATUSES = ['ALL','Available','Blocked','Hold','Booked','Sold'];

// Bug #3 fix: rawUnits = full inventory for stats; filteredUnits = pre-filtered by page.js for dropdown
export default function LeftPanel({ rawUnits, filteredUnits, state, dispatch, tab }) {
  const { typeFilter, statusFilter, selIdx, manualPrice, discount, dldPct, adminFee, downPct, preSplit, bookingDate, batchUnits } = state;

  const unit = filteredUnits[selIdx] || filteredUnits[0];
  const selling = (manualPrice > 0 ? manualPrice : unit?.selling_price) || 0;
  // Bug #17 fix: use centralised calcAutoDiscount from lib
  const autoDisc = calcAutoDiscount(downPct);
  const totalDisc = discount + autoDisc;

  // Stats use rawUnits so totals always reflect the full inventory
  const stats = {
    total: rawUnits.length,
    available: rawUnits.filter(u=>u.status==='Available').length,
    blocked: rawUnits.filter(u=>u.status==='Blocked').length,
    hold: rawUnits.filter(u=>u.status==='Hold').length,
    booked: rawUnits.filter(u=>u.status==='Booked - Pending Payment Confirmation').length,
    sold: rawUnits.filter(u=>u.status==='Sold').length,
  };

  const statusColor = unit ? getStatusColor(unit.status) : '#64748b';
  const statusLabel = unit?.status === 'Booked - Pending Payment Confirmation' ? 'Booked' : (unit?.status || '—');

  const inBatch = unit && batchUnits.some(b => b.unit_no === unit.unit_no);

  return (
    <div className="left-panel">
      <div className="card">
        <div className="card-header">Inventory &amp; Deal Parameters</div>
        <div className="card-body">
          {/* Stats */}
          <div className="stat-grid">
            {[['Total', stats.total],['Available',stats.available],['Blocked',stats.blocked],['Hold',stats.hold],['Booked',stats.booked],['Sold',stats.sold]].map(([l,n])=>(
              <div key={l} className="stat-box"><div className="stat-number">{n}</div><div className="stat-label">{l}</div></div>
            ))}
          </div>

          {/* Type filter */}
          <div className="filter-label">Unit Type</div>
          <div className="pill-group">
            {TYPES.map(t=>(
              <button key={t} className={`pill-btn${typeFilter===t?' active':''}`} onClick={()=>dispatch({type:'SET_TYPE',value:t})}>{t}</button>
            ))}
          </div>

          {/* Status filter */}
          <div className="filter-label" style={{marginTop:'0.6rem'}}>Status</div>
          <div className="pill-group">
            {STATUSES.map(s=>(
              <button key={s} className={`pill-btn${statusFilter===s?' active':''}`} onClick={()=>dispatch({type:'SET_STATUS',value:s})}>{s}</button>
            ))}
          </div>

          {/* Unit selector */}
          <div className="filter-label" style={{marginTop:'0.6rem'}}>Select Unit</div>
          <select className="unit-select" value={selIdx} onChange={e=>dispatch({type:'SET_SEL',value:+e.target.value})}>
            {filteredUnits.map((u,i)=>(
              <option key={u.unit_no} value={i}>{u.unit_no} — {u.bedrooms||'Shop'} — {u.status==='Booked - Pending Payment Confirmation'?'Booked':u.status}</option>
            ))}
          </select>

          {/* Unit details */}
          {unit && (
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">Internal sqft</div><div className="detail-value">{unit.internal_sqft?.toFixed(2)}</div></div>
              <div className="detail-item"><div className="detail-label">Balcony sqft</div><div className="detail-value">{unit.balcony_sqft?.toFixed(2)||'—'}</div></div>
              <div className="detail-item"><div className="detail-label">Net sqft</div><div className="detail-value">{unit.net_sqft?.toFixed(2)}</div></div>
              <div className="detail-item"><div className="detail-label">Rate AED/sqft</div><div className="detail-value">{formatAED(unit.rate)}</div></div>
              <div className="detail-item">
                <div className="detail-label">Status</div>
                <div className="detail-value" style={{color: statusColor}}>{statusLabel}</div>
              </div>
              <div className="detail-item"><div className="detail-label">Premium %</div><div className="detail-value">+{unit.pre_launch_price>0?(((unit.selling_price-unit.pre_launch_price)/unit.pre_launch_price)*100).toFixed(1):0}%</div></div>
              <div className="detail-item"><div className="detail-label">Pre-Launch Price</div><div className="detail-value">AED {formatAED(unit.pre_launch_price)}</div></div>
              <div className="detail-item"><div className="detail-label">Selling Price</div><div className="detail-value">AED {formatAED(unit.selling_price)}</div></div>
            </div>
          )}

          {/* Price override */}
          <div className="filter-label" style={{marginTop:'0.5rem'}}>Override Selling Price (AED)</div>
          <input className="text-input" type="text" placeholder={unit?`${formatAED(unit.selling_price)} (auto)`:'Enter amount'}
            value={manualPrice > 0 ? manualPrice : ''} onChange={e=>{const v=parseFloat(e.target.value.replace(/,/g,''));dispatch({type:'SET_MANUAL',value:isNaN(v)?0:v});}}/>

          {/* Booking date */}
          <div className="filter-label" style={{marginTop:'0.7rem'}}>Booking Date</div>
          <input suppressHydrationWarning className="text-input" type="date" value={bookingDate} onChange={e=>dispatch({type:'SET_BOOKING',value:e.target.value})}/>

          <div className="divider"/>

          {/* Discount slider */}
          <div className="slider-group">
            <div className="slider-header">
              <span>Discount {discount > 5 && <span className="warning-badge">{discount > 10 ? '⚠ CEO approval' : '⚠ Manager approval'}</span>}</span>
              <span className="slider-value">{formatPct(totalDisc)}</span>
            </div>
            <input type="range" min="0" max="20" step="0.1" value={discount} onChange={e=>dispatch({type:'SET_DISC',value:+e.target.value})}/>
            <div className="fee-badge">Auto +{formatPct(autoDisc)} (down payment &gt;15%)</div>
          </div>

          {/* DLD slider */}
          <div className="slider-group">
            <div className="slider-header"><span>DLD / Oqood</span><span className="slider-value">{formatPct(dldPct)}</span></div>
            <input type="range" min="0" max="4" step="0.1" value={dldPct} onChange={e=>dispatch({type:'SET_DLD',value:+e.target.value})}/>
            <div className="fee-badge">DLD: AED {formatAED(selling*(1-totalDisc/100)*dldPct/100)}</div>
          </div>

          {/* Admin fee */}
          <div className="slider-group">
            <div className="slider-header"><span>Admin Fee (AED)</span><span className="slider-value">{formatAED(adminFee)}</span></div>
            <input type="range" min="0" max="3000" step="50" value={adminFee} onChange={e=>dispatch({type:'SET_ADMIN',value:+e.target.value})}/>
            <div className="fee-badge">Fixed per unit</div>
          </div>

          {/* Down payment */}
          <div className="slider-group">
            <div className="slider-header"><span>Down Payment</span><span className="slider-value">{formatPct(downPct)}</span></div>
            <input type="range" min="0" max="50" step="0.5" value={downPct} onChange={e=>dispatch({type:'SET_DOWN',value:+e.target.value})}/>
            {autoDisc > 0 && <div className="fee-badge" style={{color:'#16a34a'}}>Auto-discount added: +{formatPct(autoDisc)} (higher down payment)</div>}
          </div>

          {/* Pre/Post split */}
          <div className="slider-group">
            <div className="slider-header"><span>Pre-handover Split</span><span className="slider-value">{formatPct(preSplit)}</span></div>
            <input type="range" min="10" max="90" step="0.5" value={preSplit} onChange={e=>dispatch({type:'SET_SPLIT',value:+e.target.value})}/>
            <div className="split-visualizer">
              <div className="split-bar">
                <div className="pre-segment" style={{width:`${preSplit}%`}}>Pre {preSplit.toFixed(0)}%</div>
                <div className="post-segment" style={{width:`${100-preSplit}%`}}>Post {(100-preSplit).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch controls shown in tabs 1 and 2 */}
      {(tab === 0 || tab === 1) && (
        <div className="card">
          <div className="card-header">Batch Purchase (Max 15 Units)</div>
          <div className="card-body">
            <div className="flex-between" style={{marginBottom:'0.7rem'}}>
              <button className="outline" disabled={!unit||batchUnits.length>=15||inBatch} onClick={()=>unit&&dispatch({type:'ADD_BATCH',unit:unit})}>+ Add Current Unit</button>
              <button className="outline" onClick={()=>dispatch({type:'CLEAR_BATCH'})}>Clear All</button>
            </div>
            {batchUnits.length >= 15 && <div style={{color:'var(--danger)',fontSize:'0.7rem',marginBottom:'0.5rem'}}>⚠ Maximum 15 units reached</div>}
            {batchUnits.length > 0 && (
              <div style={{maxHeight:'180px',overflowX:'auto',overflowY:'auto'}}>
                <table className="batch-table">
                  <thead><tr><th>Unit</th><th>Type</th><th>Status</th><th>Net sqft</th><th>Rate</th><th>Price</th><th/></tr></thead>
                  <tbody>
                    {batchUnits.map((u,i)=>(
                      <tr key={u.unit_no}>
                        <td>{u.unit_no}</td>
                        <td>{u.bedrooms||'—'}</td>
                        <td>{u.status==='Booked - Pending Payment Confirmation'?'Booked':u.status}</td>
                        <td>{u.net_sqft?.toFixed(1)}</td>
                        <td>{formatAED(u.rate)}</td>
                        <td>{formatAED(u.selling_price)}</td>
                        <td><button className="remove-btn" onClick={()=>dispatch({type:'REMOVE_BATCH',idx:i})}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="divider"/>
            <div className="param-row"><span className="label">Total units</span><span>{batchUnits.length}</span></div>
            <div className="param-row"><span className="label">Total area</span><span>{batchUnits.reduce((s,u)=>s+u.net_sqft,0).toFixed(2)} sqft</span></div>
            {batchUnits.length > 0 && (()=>{
              const bNet = batchUnits.reduce((s,u)=>s+u.selling_price*(1-totalDisc/100),0);
              const bDld = bNet*dldPct/100;
              const bAdmin = batchUnits.length*adminFee;
              const bDown = bNet*downPct/100;
              return (<>
                <div className="param-row"><span className="label">Total net price</span><span>AED {formatAED(bNet)}</span></div>
                <div className="param-row"><span className="label">Total DLD</span><span>AED {formatAED(bDld)}</span></div>
                <div className="param-row"><span className="label">Total admin fees</span><span>AED {formatAED(bAdmin)}</span></div>
                <div className="param-row"><span className="label">Total down payment</span><span>AED {formatAED(bDown)}</span></div>
                <div className="param-row immediate-highlight" style={{borderRadius:'0.5rem',padding:'0.5rem 0.5rem'}}><span><strong>Immediate due</strong></span><span>AED {formatAED(bDown+bDld+bAdmin)}</span></div>
                <div className="param-row"><span><strong>Total outflow</strong></span><span>AED {formatAED(bNet+bDld+bAdmin)}</span></div>
              </>);
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
