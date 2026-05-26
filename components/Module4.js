'use client';
import { useState, useMemo } from 'react';
import { formatAED, formatPct, getStatusColor } from '../lib/formatters';
import { exportInventoryCSV } from '../lib/exportUtils';

const STATUS_COLORS = {
  'Available': '#16a34a', 'Sold': '#dc2626',
  'Blocked': '#ea580c', 'Hold': '#f59e0b',
  'Booked - Pending Payment Confirmation': '#2563eb'
};
const TYPES = ['ALL','STUDIO','1 BR','2 BR','3 BR DU PH'];
const STATUSES = ['ALL','Available','Blocked','Hold','Booked','Sold'];

export default function Module4({ units }) {
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('unit_no');
  const [sortDir, setSortDir] = useState('asc');

  const stats = useMemo(() => {
    const avail = units.filter(u=>u.status==='Available').length;
    const blocked = units.filter(u=>u.status==='Blocked').length;
    const hold = units.filter(u=>u.status==='Hold').length;
    const booked = units.filter(u=>u.status==='Booked - Pending Payment Confirmation').length;
    const sold = units.filter(u=>u.status==='Sold').length;
    const pipeline = blocked+hold+booked;
    const totalVal = units.reduce((s,u)=>s+u.selling_price,0);
    const totalPre = units.reduce((s,u)=>s+u.pre_launch_price,0);
    return {total:units.length, avail, blocked, hold, booked, sold, pipeline, totalVal, totalPre};
  }, [units]);

  const revenueRows = useMemo(() => {
    const groups = [
      {label:'Sold (confirmed)', filter: u=>u.status==='Sold'},
      {label:'Booked — Pending', filter: u=>u.status==='Booked - Pending Payment Confirmation'},
      {label:'Blocked + Hold (at risk)', filter: u=>u.status==='Blocked'||u.status==='Hold'},
      {label:'Available (unsold)', filter: u=>u.status==='Available'},
    ];
    return groups.map(g => {
      const grp = units.filter(g.filter);
      const val = grp.reduce((s,u)=>s+u.selling_price,0);
      return {label:g.label, count:grp.length, value:val, pct: stats.totalVal>0?(val/stats.totalVal)*100:0};
    });
  }, [units, stats]);

  const typeRows = useMemo(() => {
    const types = ['STUDIO','1 BR','2 BR','3 BR DU PH'];
    return types.map(t => {
      const grp = units.filter(u=>u.bedrooms===t);
      const avail = grp.filter(u=>u.status==='Available').length;
      const sold = grp.filter(u=>u.status==='Sold').length;
      const pipeline = grp.filter(u=>u.status!=='Available'&&u.status!=='Sold').length;
      const totalVal = grp.reduce((s,u)=>s+u.selling_price,0);
      const avgPrice = grp.length>0?totalVal/grp.length:0;
      const rates = grp.map(u=>u.rate).filter(r=>r>0);
      const avgRate = rates.length>0?rates.reduce((s,r)=>s+r,0)/rates.length:0;
      const minRate = rates.length>0?Math.min(...rates):0;
      const maxRate = rates.length>0?Math.max(...rates):0;
      return {type:t, total:grp.length, avail, sold, pipeline, totalVal, avgPrice, avgRate, minRate, maxRate};
    });
  }, [units]);

  const filtered = useMemo(() => {
    let f = [...units];
    if (typeFilter!=='ALL') f = f.filter(u=>u.bedrooms===typeFilter);
    if (statusFilter!=='ALL') {
      if (statusFilter==='Booked') f = f.filter(u=>u.status==='Booked - Pending Payment Confirmation');
      else f = f.filter(u=>u.status===statusFilter);
    }
    f.sort((a,b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (typeof av==='number') return sortDir==='asc'?av-bv:bv-av;
      return sortDir==='asc'?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av));
    });
    return f;
  }, [units, typeFilter, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey===key) setSortDir(d=>d==='asc'?'desc':'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const arrow = (key) => sortKey===key?(sortDir==='asc'?'↑':'↓'):'↕';

  return (
    <div style={{padding:'0 0.5rem'}}>
      {/* Top stats */}
      <div className="stat-grid" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:'1.2rem'}}>
        {[
          {n:stats.total, l:'Total Units'},
          {n:`${stats.avail} (${((stats.avail/stats.total)*100).toFixed(0)}%)`, l:'Available'},
          {n:`${stats.pipeline} (${((stats.pipeline/stats.total)*100).toFixed(0)}%)`, l:'In Pipeline'},
          {n:`${stats.sold} (${((stats.sold/stats.total)*100).toFixed(0)}%)`, l:'Sold'},
          {n:`AED ${formatAED(stats.totalVal)}`, l:'Total Project Value'},
        ].map((s,i)=>(
          <div key={i} className="stat-box"><div className="stat-number" style={{fontSize:'0.95rem'}}>{s.n}</div><div className="stat-label">{s.l}</div></div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.2rem',marginBottom:'1.2rem'}}>
        {/* Revenue Summary */}
        <div className="card">
          <div className="card-header">Revenue Summary</div>
          <div className="card-body" style={{padding:'0'}}>
            <table className="type-breakdown-table">
              <thead><tr><th>Category</th><th>Units</th><th>Total Value (AED)</th><th>% of Project</th></tr></thead>
              <tbody>
                {revenueRows.map((r,i)=>(
                  <tr key={i}><td>{r.label}</td><td>{r.count}</td><td>{formatAED(r.value)}</td><td>{formatPct(r.pct)}</td></tr>
                ))}
                <tr style={{fontWeight:700,background:'var(--off-white)'}}>
                  <td>Total</td><td>{stats.total}</td><td>{formatAED(stats.totalVal)}</td><td>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pre-launch vs Current */}
        <div className="card">
          <div className="card-header">Pre-Launch vs Current Pricing</div>
          <div className="card-body">
            <div className="prelaunch-box">
              <div className="pl-row"><span className="pl-label">Total pre-launch value</span><span className="pl-value">AED {formatAED(stats.totalPre)}</span></div>
              <div className="pl-row"><span className="pl-label">Total current selling value</span><span className="pl-value">AED {formatAED(stats.totalVal)}</span></div>
              <div className="pl-row"><span className="pl-label">Total appreciation</span><span className="pl-value" style={{color:'#16a34a'}}>AED {formatAED(stats.totalVal-stats.totalPre)} (+{formatPct(stats.totalPre>0?((stats.totalVal-stats.totalPre)/stats.totalPre)*100:0)})</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* By Type */}
      <div className="card" style={{marginBottom:'1.2rem'}}>
        <div className="card-header">By Unit Type Breakdown</div>
        <div className="card-body" style={{padding:0,overflowX:'auto'}}>
          <table className="type-breakdown-table">
            <thead><tr><th>Type</th><th>Total</th><th>Available</th><th>Sold</th><th>Pipeline</th><th>Avg Rate/sqft</th><th>Min Rate</th><th>Max Rate</th><th>Avg Price</th><th>Total Value</th></tr></thead>
            <tbody>
              {typeRows.map(r=>(
                <tr key={r.type}>
                  <td><strong>{r.type}</strong></td><td>{r.total}</td><td>{r.avail}</td><td>{r.sold}</td><td>{r.pipeline}</td>
                  <td>{formatAED(r.avgRate)}</td><td>{formatAED(r.minRate)}</td><td>{formatAED(r.maxRate)}</td>
                  <td>{formatAED(r.avgPrice)}</td><td>{formatAED(r.totalVal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Inventory */}
      <div className="card">
        <div className="card-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Full Inventory ({filtered.length} units)</span>
          <button className="outline no-print" style={{fontSize:'0.65rem',padding:'0.25rem 0.75rem'}} onClick={()=>exportInventoryCSV(filtered)}>Export CSV</button>
        </div>
        <div className="card-body" style={{padding:0}}>
          <div className="pill-group" style={{padding:'0.7rem 1rem 0.5rem',borderBottom:'0.5px solid var(--border)'}}>
            {TYPES.map(t=><button key={t} className={`pill-btn${typeFilter===t?' active':''}`} onClick={()=>setTypeFilter(t)}>{t}</button>)}
            <span style={{width:'0.5px',background:'var(--border)',margin:'0 0.3rem'}}/>
            {STATUSES.map(s=><button key={s} className={`pill-btn${statusFilter===s?' active':''}`} onClick={()=>setStatusFilter(s)}>{s}</button>)}
          </div>
          <div style={{maxHeight:'400px',overflowY:'auto',overflowX:'auto'}}>
            <table className="inventory-full-table">
              <thead><tr>
                {[['unit_no','Unit No'],['bedrooms','Type'],['status','Status'],['internal_sqft','Internal sqft'],['balcony_sqft','Balcony sqft'],['net_sqft','Net sqft'],['rate','Rate/sqft'],['pre_launch_price','Pre-Launch Price'],['selling_price','Selling Price']].map(([k,l])=>(
                  <th key={k} onClick={()=>toggleSort(k)}>{l}<span className="sort-arrow">{arrow(k)}</span></th>
                ))}
                <th>Premium %</th>
              </tr></thead>
              <tbody>
                {filtered.map(u=>{
                  const clr = STATUS_COLORS[u.status]||'#64748b';
                  const prem = u.pre_launch_price>0?((u.selling_price-u.pre_launch_price)/u.pre_launch_price*100):0;
                  return (
                    <tr key={u.unit_no}>
                      <td><strong>{u.unit_no}</strong></td>
                      <td>{u.bedrooms||'—'}</td>
                      <td><span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem'}}>
                        <span style={{width:7,height:7,borderRadius:'50%',background:clr,flexShrink:0,display:'inline-block'}}/>
                        {u.status==='Booked - Pending Payment Confirmation'?'Booked':u.status}
                      </span></td>
                      <td>{u.internal_sqft?.toFixed(2)}</td>
                      <td>{u.balcony_sqft?.toFixed(2)||'—'}</td>
                      <td>{u.net_sqft?.toFixed(2)}</td>
                      <td>{formatAED(u.rate)}</td>
                      <td>{formatAED(u.pre_launch_price)}</td>
                      <td>{formatAED(u.selling_price)}</td>
                      <td>+{prem.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
