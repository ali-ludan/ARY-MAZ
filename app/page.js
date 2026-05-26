'use client';
import { useState, useEffect, useReducer, useMemo } from 'react';
import { parseInventoryCSV, filterUnits } from '../lib/inventory';
import LeftPanel from '../components/LeftPanel';
import RightPanel from '../components/RightPanel';
import OfferModal from '../components/OfferModal';
import Module4 from '../components/Module4';
import { Module3Inner } from '../components/Module3';

const TABS = ['Unit Price','Batch Purchase','Discount Impact','Inventory Status'];

const today = new Date().toISOString().slice(0,10);

const initState = {
  typeFilter:'ALL', statusFilter:'ALL', selIdx:0, manualPrice:0,
  discount:0, dldPct:4, adminFee:3000, downPct:15, preSplit:60,
  bookingDate:today, batchUnits:[], offerOpen:false
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
    case 'RESET':       return {...initState, bookingDate:today};
    default:            return state;
  }
}

export default function Page() {
  const [tab, setTab] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, dispatch] = useReducer(reducer, initState);

  useEffect(() => {
    fetch('/inventory.csv')
      .then(r => r.text())
      .then(csv => { setInventory(parseInventoryCSV(csv)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredUnits = useMemo(() => filterUnits(inventory, state.typeFilter, state.statusFilter), [inventory, state.typeFilter, state.statusFilter]);

  const unit = filteredUnits[state.selIdx] || filteredUnits[0] || null;

  const params = {
    discount: state.discount, dldPct: state.dldPct, adminFee: state.adminFee,
    downPct: state.downPct, preSplit: state.preSplit, bookingDate: state.bookingDate,
    manualPrice: state.manualPrice
  };

  const autoDisc = Math.max(0, Math.floor((state.downPct - 15) / 5) * 0.5);
  const totalDisc = state.discount + autoDisc;

  // Offer letter units: batch or single
  const offerUnits = state.batchUnits.length > 0 ? state.batchUnits : (unit ? [unit] : []);
  const offerParams = { discountPct: totalDisc, dldPct: state.dldPct, adminFee: state.adminFee, downPct: state.downPct };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"/>
        <div className="loading-text">Loading inventory data…</div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard">
        {/* Header */}
        <div className="app-header">
          <div>
            <div className="app-title">ARY &amp; MAZ Developments</div>
            <div className="app-subtitle">Smart Calculator Engine · Dubai, UAE</div>
          </div>
          <button className="outline" onClick={()=>dispatch({type:'RESET'})} style={{fontSize:'0.7rem',padding:'0.35rem 0.9rem'}}>↺ Reset All</button>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {TABS.map((t,i)=>(
            <button key={t} className={`tab-btn${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>
          ))}
        </div>

        {/* Module 1 — Unit Price Breakdown */}
        {tab === 0 && (
          <div className="two-columns">
            <LeftPanel units={filteredUnits} state={state} dispatch={dispatch} tab={0}/>
            <RightPanel
              unit={unit}
              params={params}
              batchUnits={[]}
              onOfferLetter={()=>dispatch({type:'OPEN_OFFER'})}
            />
          </div>
        )}

        {/* Module 2 — Batch Purchase */}
        {tab === 1 && (
          <div className="two-columns">
            <LeftPanel units={filteredUnits} state={state} dispatch={dispatch} tab={1}/>
            <RightPanel
              unit={unit}
              params={params}
              batchUnits={state.batchUnits}
              onOfferLetter={()=>dispatch({type:'OPEN_OFFER'})}
            />
          </div>
        )}

        {/* Module 3 — Discount Impact */}
        {tab === 2 && inventory.length > 0 && (
          <Module3Inner units={inventory}/>
        )}

        {/* Module 4 — Inventory Status */}
        {tab === 3 && (
          <div style={{overflowY:'auto',flex:1}}>
            <Module4 units={inventory}/>
          </div>
        )}
      </div>

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
