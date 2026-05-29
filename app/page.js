'use client';
import { useState, useEffect, useReducer, useMemo } from 'react';
import { parseInventoryCSV, filterUnits } from '../lib/inventory';
import { calcAutoDiscount } from '../lib/calculations';
import LeftPanel from '../components/LeftPanel';
import RightPanel from '../components/RightPanel';
import OfferModal from '../components/OfferModal';
import Module4 from '../components/Module4';
import { Module3Inner } from '../components/Module3';
import LoginForm from '../components/LoginForm';

// Tab configuration
const ADMIN_TABS = ['Unit Price','Batch Purchase','Discount Impact','Inventory Status'];
const USER_TABS = ['Unit Price','Batch Purchase'];

const initState = {
  typeFilter:'ALL', statusFilter:'ALL', selIdx:0, manualPrice:0,
  discount:0, dldPct:4, adminFee:3000, downPct:15, preSplit:60,
  bookingDate:'', batchUnits:[], offerOpen:false
};

function reducer(state, action) {
  switch(action.type) {
    case 'SET_TYPE':    return {...state, typeFilter:action.value, selIdx:0};
    case 'SET_STATUS':  return {...state, statusFilter:action.value, selIdx:0};
    case 'SET_SEL':     return {...state, selIdx:action.value};
    case 'SET_MANUAL':  return {...state, manualPrice:action.value};
    case 'SET_DISC':    return {...state, discount:action.value};
    case 'SET_DLD':     return {...state, dldPct:action.value};
    case 'SET_ADMIN':   return {...state, adminFee:action.value};
    case 'SET_DOWN':    return {...state, downPct:action.value};
    case 'SET_SPLIT':   return {...state, preSplit:action.value};
    case 'SET_BOOKING': return {...state, bookingDate:action.value};
    case 'ADD_BATCH':   return state.batchUnits.some(b=>b.unit_no===action.unit.unit_no)||state.batchUnits.length>=15 ? state : {...state, batchUnits:[...state.batchUnits, action.unit]};
    case 'REMOVE_BATCH':return {...state, batchUnits:state.batchUnits.filter((_,i)=>i!==action.idx)};
    case 'CLEAR_BATCH': return {...state, batchUnits:[]};
    case 'OPEN_OFFER':  return {...state, offerOpen:true};
    case 'CLOSE_OFFER': return {...state, offerOpen:false};
    case 'RESET':       return {...initState, bookingDate: new Date().toISOString().slice(0,10)};
    default:            return state;
  }
}

export default function Page() {
  const [tab, setTab] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionRole, setSessionRole] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [state, dispatch] = useReducer(reducer, initState);

  // Initialize booking date on mount
  useEffect(() => {
    if (!state.bookingDate) {
      dispatch({ type: 'SET_BOOKING', value: new Date().toISOString().slice(0,10) });
    }
  }, []);

  // Check auth session on load
  useEffect(() => {
    fetch('/api/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSessionRole(data.role);
          fetchInventory();
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchInventory = () => {
    setLoading(true);
    setFetchError(null);
    fetch('/api/inventory')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load inventory: HTTP ${res.status}`);
        return res.text();
      })
      .then(csv => {
        const parsed = parseInventoryCSV(csv);
        setInventory(parsed);
        setLoading(false);
      })
      .catch(err => {
        console.error('[inventory fetch]', err.message);
        setFetchError(err.message);
        setLoading(false);
      });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setSessionRole(null);
      setInventory([]);
      setTab(0);
      dispatch({ type: 'RESET' });
    } catch (err) {
      console.error('[Logout]', err);
    }
  };

  // Determine active tabs based on user role
  const activeTabs = sessionRole === 'admin' ? ADMIN_TABS : USER_TABS;

  // Bug #3 fix: filteredUnits computed ONCE here; LeftPanel receives both raw + filtered.
  const filteredUnits = useMemo(
    () => filterUnits(inventory, state.typeFilter, state.statusFilter),
    [inventory, state.typeFilter, state.statusFilter]
  );

  const unit = filteredUnits[state.selIdx] || filteredUnits[0] || null;

  // Centralised auto discount calculation
  const autoDisc = calcAutoDiscount(state.downPct);
  const totalDisc = state.discount + autoDisc;

  const params = {
    discount: state.discount, dldPct: state.dldPct, adminFee: state.adminFee,
    downPct: state.downPct, preSplit: state.preSplit, bookingDate: state.bookingDate,
    manualPrice: state.manualPrice
  };

  // Offer Letter configuration
  const offerUnits = state.batchUnits.length > 0 ? state.batchUnits : (unit ? [unit] : []);
  const offerParams = { discountPct: totalDisc, dldPct: state.dldPct, adminFee: state.adminFee, downPct: state.downPct };

  // Show login form if not authenticated
  if (!sessionRole && !loading) {
    return <LoginForm onLoginSuccess={(role) => { setSessionRole(role); fetchInventory(); }} />;
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"/>
        <div className="loading-text">Loading secure session &amp; inventory data…</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="loading-screen">
        <div style={{fontSize:'2rem'}}>⚠️</div>
        <div className="loading-text" style={{color:'var(--danger)',maxWidth:420,textAlign:'center'}}>{fetchError}</div>
        <button className="outline" style={{marginTop:'1rem'}} onClick={fetchInventory}>↺ Retry</button>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard">
        {/* Header */}
        <div className="app-header">
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <div style={{width:4,height:32,borderRadius:4,background:'var(--accent)',flexShrink:0}}/>
            <div>
              <div className="app-title">ARY &amp; MAZ Developments</div>
              <div className="app-subtitle">Smart Calculator Engine · Dubai, UAE</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <span suppressHydrationWarning style={{fontSize:'0.65rem',color:'var(--accent)',fontWeight:500}}>{new Date().toLocaleDateString('en-AE',{day:'numeric',month:'short',year:'numeric'})}</span>
            <span style={{fontSize:'0.6rem',background:'var(--accent)',color:'var(--stat-highlight)',padding:'0.2rem 0.7rem',borderRadius:'2rem',fontWeight:700,letterSpacing:'0.5px',textTransform:'uppercase'}}>{sessionRole === 'admin' ? 'Admin' : 'Agent'}</span>
            <button className="outline" onClick={()=>dispatch({type:'RESET'})} style={{fontSize:'0.7rem',padding:'0.35rem 0.9rem'}}>↺ Reset All</button>
            <button className="outline" onClick={handleLogout} style={{fontSize:'0.7rem',padding:'0.35rem 0.9rem',marginRight:'2.5rem',borderColor:'var(--danger)',color:'var(--danger)'}}>✕ Sign Out</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {activeTabs.map((t,i)=>(
            <button key={t} className={`tab-btn${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>
          ))}
        </div>
        <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',paddingTop:'1rem'}}>

        {/* Module 1 — Unit Price Breakdown */}
        {tab === 0 && (
          <div className="two-columns">
            <LeftPanel rawUnits={inventory} filteredUnits={filteredUnits} state={state} dispatch={dispatch} tab={0}/>
            <RightPanel
              unit={unit}
              params={params}
              batchUnits={[]}
              onOfferLetter={()=>dispatch({type:'OPEN_OFFER'})}
              inventory={inventory}
            />
          </div>
        )}

        {/* Module 2 — Batch Purchase */}
        {tab === 1 && (
          <div className="two-columns">
            <LeftPanel rawUnits={inventory} filteredUnits={filteredUnits} state={state} dispatch={dispatch} tab={1}/>
            <RightPanel
              unit={unit}
              params={params}
              batchUnits={state.batchUnits}
              onOfferLetter={()=>dispatch({type:'OPEN_OFFER'})}
              inventory={inventory}
            />
          </div>
        )}

        {/* Module 3 — Discount Impact */}
        {tab === 2 && sessionRole === 'admin' && inventory.length > 0 && (
          <Module3Inner units={inventory}/>
        )}

        {/* Module 4 — Inventory Status */}
        {tab === 3 && sessionRole === 'admin' && (
          <div style={{overflowY:'auto',flex:1}}>
            <Module4 units={inventory}/>
          </div>
        )}
        </div>{/* end inner flex wrapper */}
      </div>{/* end dashboard */}

      {/* Offer Letter Modal */}
      <OfferModal
        open={state.offerOpen}
        onClose={()=>dispatch({type:'CLOSE_OFFER'})}
        units={offerUnits}
        params={offerParams}
      />
    </>
  );
}
