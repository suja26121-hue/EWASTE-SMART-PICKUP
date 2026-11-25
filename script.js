// ============================================================
//  script.js — Smart E-Waste Collection Portal (Smart Cities)
//  Handles: multi-role logic, localStorage, tracking,
//  Leaflet map, NGO/driver assign, leaderboard, facility verify,
//  district stats, charts, rewards, language toggle.
// ============================================================

'use strict';

// ── LANGUAGE STRINGS ─────────────────────────────────────────
const LANG = {
  en: {
    requestPickup: 'Request E-Waste Pickup',
    trackRequests: 'Track My Requests',
    myRewards: 'My Rewards',
    leaderboard: 'Leaderboard',
    home: 'Home',
    citizen: 'Citizen Portal',
    ngo: 'NGO Admin',
    driver: 'Driver Dashboard',
    authority: 'District Authority',
    submitBtn: 'Request Pickup',
    trackBtn: 'Track',
    fullName: 'Full Name',
    phone: 'Phone Number',
    area: 'Area',
    ewasteType: 'E-Waste Type',
    qty: 'Quantity (kg)',
    prefDate: 'Preferred Date',
    prefTime: 'Preferred Time',
    address: 'Full Address',
    wipeReminder: 'Please wipe your data before handing over devices. Factory reset phones, format hard drives, and delete personal files from all items.',
    joinBatch: 'Join Ward Batch Pickup Day (reduce delivery cost)',
    uploadPhoto: 'Upload Photo (optional)'
  },
  ta: {
    requestPickup: 'மின் கழிவு சேகரிப்பு கோரிக்கை',
    trackRequests: 'என் கோரிக்கைகளை கண்காணி',
    myRewards: 'என் வெகுமதிகள்',
    leaderboard: 'முன்னணி பட்டியல்',
    home: 'முகப்பு',
    citizen: 'குடிமகன் போர்டல்',
    ngo: 'NGO நிர்வாகி',
    driver: 'ஓட்டுனர் டாஷ்போர்ட்',
    authority: 'மாவட்ட அதிகாரம்',
    submitBtn: 'கோரிக்கை சமர்ப்பி',
    trackBtn: 'கண்காணி',
    fullName: 'முழு பெயர்',
    phone: 'தொலைபேசி எண்',
    area: 'பகுதி',
    ewasteType: 'மின் கழிவு வகை',
    qty: 'அளவு (கிலோ)',
    prefDate: 'விரும்பிய தேதி',
    prefTime: 'விரும்பிய நேரம்',
    address: 'முழு முகவரி',
    wipeReminder: 'சாதனங்களை ஒப்படைக்கும் முன் உங்கள் தரவை அழிக்கவும். தொலைபேசிகளை ஃபேக்டரி ரீசெட் செய்யவும், ஹார்ட் டிரைவ்களை ஃபார்மேட் செய்யவும்.',
    joinBatch: 'வார்டு தொகுதி சேகரிப்பு நாளில் சேர',
    uploadPhoto: 'புகைப்படம் பதிவேற்று (விருப்பத்திற்கு)'
  }
};
let currentLang = 'en';

// ── CURRENT ROLE ──────────────────────────────────────────────
let currentRole = 'citizen'; // citizen | ngo | driver | authority

// ── RUNTIME STATE ─────────────────────────────────────────────
let requests = [];
let ngos     = [];
let drivers  = [];
let prevWinners = [];
let assignedIds = new Set();
let impactChart = null;
let districtCharts = {};
let trackingMap = null;
let driverMarker = null;
let driverAnimInterval = null;

// Logged-in demo users
const DEMO_USERS = {
  citizen:   { name:'Demo Citizen',    phone:'9876543210' },
  ngo:       { name:'NGO Admin User',  ngoId:'NGO-01' },
  driver:    { name:'Driver (Demo)',   driverId:'DRV-01' },
  authority: { name:'District Admin',  district:'Chengalpattu' }
};

// ── LOCAL STORAGE KEYS ────────────────────────────────────────
const LS_REQUESTS  = 'ewaste_requests';
const LS_NGOS      = 'ewaste_ngos';
const LS_DRIVERS   = 'ewaste_drivers';
const LS_WINNERS   = 'ewaste_winners';
const LS_SEEDED    = 'ewaste_seeded_v3';

// ── HELPERS ───────────────────────────────────────────────────
function today()      { return new Date().toISOString().split('T')[0]; }
function addDays(d,n) { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().split('T')[0]; }
function diffDays(a,b){ return Math.round((new Date(a)-new Date(b))/86400000); }
function haversine(a,b){
  const R=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
  const s=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));
}
let _idCounter = 30;
function genId(){ _idCounter++; return 'EW-'+String(_idCounter).padStart(3,'0'); }

function t(key){ return (LANG[currentLang]||LANG.en)[key] || key; }

function priorityScore(req){
  const diff=diffDays(req.date,today());
  let ds=diff===0?30:diff===1?24:diff<=3?18:diff<=7?12:6;
  return Math.min(req.qty,50)+ds+(req.type==='Batteries'?20:0);
}

function saveAll(){
  localStorage.setItem(LS_REQUESTS, JSON.stringify(requests));
  localStorage.setItem(LS_DRIVERS,  JSON.stringify(drivers));
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type='success'){
  const icons={success:'fa-circle-check',error:'fa-circle-xmark',info:'fa-circle-info'};
  const el=document.createElement('div');
  el.className=`toast ${type}`;
  el.innerHTML=`<i class="fa-solid ${icons[type]||icons.info} ${type}"></i><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(()=>{ el.style.animation='slideOut 0.3s ease forwards'; setTimeout(()=>el.remove(),300); },3200);
}

// ── STATUS BADGE ──────────────────────────────────────────────
function statusBadge(s){
  const map={
    'Requested':           ['badge-requested','fa-clock'],
    'Driver Assigned':     ['badge-assigned','fa-user-check'],
    'On the Way':          ['badge-onway','fa-truck-fast'],
    'Collected':           ['badge-collected','fa-circle-check'],
    'Delivered to Facility':['badge-delivered','fa-warehouse'],
    'Verified':            ['badge-verified','fa-shield-check']
  };
  const [cls,icon]=map[s]||['badge-requested','fa-clock'];
  return `<span class="badge ${cls}"><i class="fa-solid ${icon}"></i>${s}</span>`;
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Load or seed data
  if (!localStorage.getItem(LS_SEEDED)) {
    requests   = buildSeedRequests();
    ngos       = JSON.parse(JSON.stringify(SEED_NGOS));
    drivers    = JSON.parse(JSON.stringify(SEED_DRIVERS));
    prevWinners= JSON.parse(JSON.stringify(SEED_PREV_WINNERS));
    localStorage.setItem(LS_REQUESTS, JSON.stringify(requests));
    localStorage.setItem(LS_NGOS,     JSON.stringify(ngos));
    localStorage.setItem(LS_DRIVERS,  JSON.stringify(drivers));
    localStorage.setItem(LS_WINNERS,  JSON.stringify(prevWinners));
    localStorage.setItem(LS_SEEDED,   '1');
  } else {
    requests   = JSON.parse(localStorage.getItem(LS_REQUESTS) || '[]');
    ngos       = JSON.parse(localStorage.getItem(LS_NGOS)     || '[]');
    drivers    = JSON.parse(localStorage.getItem(LS_DRIVERS)  || '[]');
    prevWinners= JSON.parse(localStorage.getItem(LS_WINNERS)  || '[]');
  }
  _idCounter = requests.reduce((m,r)=>{ const n=parseInt(r.id.split('-')[1]); return n>m?n:m; }, 30);

  // Date min
  const df=document.getElementById('f-date');
  if(df) df.min=today();

  // Phone track input error clear
  const tp=document.getElementById('t-phone');
  if(tp) tp.addEventListener('input',()=>tp.classList.remove('error'));

  // Role selector
  document.getElementById('role-select').addEventListener('change', e=>{
    currentRole=e.target.value;
    updateRoleView();
  });

  updateRoleView();
  renderHome();
  applyLang();
});

// ── RESET DEMO DATA ───────────────────────────────────────────
function resetDemoData(){
  localStorage.removeItem(LS_SEEDED);
  localStorage.removeItem(LS_REQUESTS);
  localStorage.removeItem(LS_NGOS);
  localStorage.removeItem(LS_DRIVERS);
  localStorage.removeItem(LS_WINNERS);
  location.reload();
}

// ── LANGUAGE TOGGLE ───────────────────────────────────────────
function toggleLang(){
  currentLang = currentLang==='en'?'ta':'en';
  document.getElementById('lang-btn').textContent = currentLang==='en'?'தமிழ்':'English';
  applyLang();
}
function applyLang(){
  const L=LANG[currentLang]||LANG.en;
  // Nav tabs — update text node only, preserve icon
  setTabLabel('tab-home',    L.home);
  setTabLabel('tab-citizen', L.citizen);
  setTabLabel('tab-ngo',     L.ngo);
  setTabLabel('tab-driver',  L.driver);
  setTabLabel('tab-authority',L.authority);
  setTabLabel('tab-leaderboard',L.leaderboard);
  // Form labels
  safeSetLabel('lbl-name',    L.fullName);
  safeSetLabel('lbl-phone',   L.phone);
  safeSetLabel('lbl-area',    L.area);
  safeSetLabel('lbl-type',    L.ewasteType);
  safeSetLabel('lbl-qty',     L.qty);
  safeSetLabel('lbl-date',    L.prefDate);
  safeSetLabel('lbl-time',    L.prefTime);
  safeSetLabel('lbl-address', L.address);
  safeSet('lbl-wipe', L.wipeReminder);
  safeSet('lbl-batch', L.joinBatch);
  safeSet('lbl-photo', L.uploadPhoto);
  safeSet('submit-btn', null, `<i class="fa-solid fa-paper-plane"></i> ${L.submitBtn}`);
  safeSet('track-btn', null, `<i class="fa-solid fa-search"></i> ${L.trackBtn}`);
}
function safeSet(id, text, html){
  const el=document.getElementById(id);
  if(!el) return;
  if(html!==undefined && html!==null) el.innerHTML=html;
  else if(text) el.textContent=text;
}
function setTabLabel(id, text){
  const el=document.getElementById(id);
  if(!el) return;
  // Find text node (last child or direct text node after any icon)
  const nodes=[...el.childNodes];
  const textNode=nodes.find(n=>n.nodeType===3&&n.textContent.trim());
  if(textNode) textNode.textContent=' '+text;
  else {
    // append text safely
    const tn=document.createTextNode(' '+text);
    el.appendChild(tn);
  }
}
function safeSetLabel(id, text){
  const el=document.getElementById(id);
  if(!el) return;
  el.textContent=text;
}

// ── ROLE VIEW SWITCHING ───────────────────────────────────────
function updateRoleView(){
  const panels=['home','citizen','ngo','driver','authority','leaderboard'];
  panels.forEach(p=>{
    const el=document.getElementById('panel-'+p);
    if(el) el.classList.add('hidden');
  });

  // Show tabs appropriate for role
  const roleTabs={
    citizen:   ['home','citizen','leaderboard'],
    ngo:       ['home','ngo','leaderboard'],
    driver:    ['home','driver'],
    authority: ['home','authority','leaderboard']
  };
  document.querySelectorAll('.nav-tab').forEach(t=>{
    const tab=t.dataset.tab;
    const allowed=roleTabs[currentRole]||['home'];
    t.classList.toggle('role-hidden', !allowed.includes(tab));
  });

  // Show appropriate default panel
  const defaultPanel={citizen:'citizen',ngo:'ngo',driver:'driver',authority:'authority'}[currentRole]||'home';
  switchTab(defaultPanel);
}

// ── TAB SWITCHING ─────────────────────────────────────────────
function switchTab(tab){
  const panels=['home','citizen','ngo','driver','authority','leaderboard'];
  panels.forEach(p=>{
    const el=document.getElementById('panel-'+p);
    if(el) el.classList.toggle('hidden', p!==tab);
  });
  document.querySelectorAll('.nav-tab').forEach(t=>{
    t.classList.toggle('active', t.dataset.tab===tab);
  });
  // Render on demand
  if(tab==='ngo')       renderNGO();
  if(tab==='authority') renderAuthority();
  if(tab==='leaderboard') renderLeaderboard();
  if(tab==='driver')    renderDriver();
  if(tab==='citizen')   renderCitizenRewards();
}

// ── HOME PAGE ─────────────────────────────────────────────────
function renderHome(){
  // already static HTML, no dynamic render needed
}

// ── PICKUP FORM ───────────────────────────────────────────────
function validate(id, check){
  const el=document.getElementById(id);
  if(!el) return true;
  const ok=check(el.value);
  el.classList.toggle('error',!ok);
  return ok;
}

function handlePhotoUpload(input){
  const file=input.files[0];
  const preview=document.getElementById('photo-preview');
  if(file && file.type.startsWith('image/')){
    const reader=new FileReader();
    reader.onload=e=>{ preview.src=e.target.result; preview.style.display='block'; };
    reader.readAsDataURL(file);
  } else {
    preview.style.display='none';
  }
}

function submitPickup(e){
  e.preventDefault();
  const minDate=today();
  let valid=true;
  valid &= validate('f-name',    v=>v.trim().length>=2);
  valid &= validate('f-phone',   v=>/^\d{10}$/.test(v.trim()));
  valid &= validate('f-area',    v=>v!=='');
  valid &= validate('f-type',    v=>v!=='');
  valid &= validate('f-qty',     v=>parseFloat(v)>=0.5);
  valid &= validate('f-date',    v=>v>=minDate);
  valid &= validate('f-time',    v=>v!=='');
  valid &= validate('f-address', v=>v.trim().length>=5);
  if(!valid){ showToast('Please fill all required fields correctly.','error'); return; }

  // Check wipe checkbox
  const wipeCheck=document.getElementById('f-wipe');
  if(wipeCheck && !wipeCheck.checked){
    showToast('Please confirm you have wiped your device data before submitting.','error');
    return;
  }

  const req={
    id: genId(),
    name: document.getElementById('f-name').value.trim(),
    nickname: 'User_'+Math.floor(Math.random()*9000+1000),
    phone: document.getElementById('f-phone').value.trim(),
    area: document.getElementById('f-area').value,
    address: document.getElementById('f-address').value.trim(),
    type: document.getElementById('f-type').value,
    qty: parseFloat(document.getElementById('f-qty').value),
    date: document.getElementById('f-date').value,
    time: document.getElementById('f-time').value,
    wardBatch: document.getElementById('f-batch')?.checked||false,
    photoUrl: '',
    status:'Requested',
    ngoId:null, driverId:null, verifiedKg:null,
    district:'Chengalpattu',
    points:0
  };
  requests.push(req);
  saveAll();
  showToast(`Pickup request ${req.id} submitted! You will receive updates as it progresses.`);
  document.getElementById('pickup-form').reset();
  document.getElementById('photo-preview').style.display='none';
  ['f-name','f-phone','f-area','f-type','f-qty','f-date','f-time','f-address']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.remove('error'); });
  renderCitizenRewards();
}

// ── CITIZEN REWARDS PANEL ─────────────────────────────────────
function renderCitizenRewards(){
  const phone=DEMO_USERS.citizen.phone;
  const myReqs=requests.filter(r=>r.phone===phone);
  const totalKg=myReqs.reduce((s,r)=>s+(r.verifiedKg||0),0);
  const totalPts=myReqs.reduce((s,r)=>s+(r.points||0),0);
  // rank in Tambaram (demo area)
  const area='Tambaram';
  const areaUsers=getLeaderboardData(area);
  const rank=areaUsers.findIndex(u=>u.phone===phone)+1;
  const el=document.getElementById('citizen-rewards');
  if(!el) return;
  el.innerHTML=`
    <div class="reward-card">
      <div class="reward-icon">🏆</div>
      <div class="reward-stat"><span class="reward-stat-val">${totalPts}</span><span class="reward-stat-lbl">My Points (Demo)</span></div>
      <div class="reward-stat"><span class="reward-stat-val">${totalKg.toFixed(1)} kg</span><span class="reward-stat-lbl">Verified kg</span></div>
      <div class="reward-stat"><span class="reward-stat-val">${rank>0?'#'+rank:'—'}</span><span class="reward-stat-lbl">My Rank in ${area}</span></div>
      <div class="reward-stat"><span class="reward-stat-val">${myReqs.length}</span><span class="reward-stat-lbl">Requests</span></div>
    </div>`;
}

// ── TRACK REQUESTS ────────────────────────────────────────────
function trackRequests(){
  const phone=document.getElementById('t-phone').value.trim();
  const wrap=document.getElementById('track-results');
  if(!/^\d{10}$/.test(phone)){ showToast('Enter a valid 10-digit phone number.','error'); return; }
  const found=requests.filter(r=>r.phone===phone);
  if(!found.length){
    wrap.innerHTML=`<div class="empty-state"><i class="fa-solid fa-box-open"></i><p>No requests found for this number. (Try 9876543210 for demo data)</p></div>`;
    return;
  }

  // Destroy previous map
  if(trackingMap){ trackingMap.remove(); trackingMap=null; }
  if(driverAnimInterval){ clearInterval(driverAnimInterval); driverAnimInterval=null; }

  let html='';
  found.forEach(r=>{
    const drv=drivers.find(d=>d.id===r.driverId);
    const drvName=drv?drv.name:'Not yet assigned';
    const drvPhone=drv?drv.phone:'—';
    const eta=r.status==='On the Way'?'~25 min':(r.status==='Driver Assigned'?'~45 min':'N/A');
    html+=`
    <div class="glass-card" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
        <div>
          <strong style="font-size:1rem;">${r.id}</strong>
          <span style="margin-left:12px;">${statusBadge(r.status)}</span>
          ${r.wardBatch?'<span class="badge badge-assigned" style="margin-left:8px;"><i class="fa-solid fa-users"></i>Ward Batch</span>':''}
        </div>
        <div style="font-size:0.8rem;color:var(--text-secondary);">${r.type} · ${r.qty} kg · ${r.area}</div>
      </div>
      <!-- Status Timeline -->
      <div class="timeline">${buildTimeline(r.status)}</div>
      <!-- Driver Info -->
      <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">
        <div style="font-size:0.82rem;"><span style="color:var(--text-secondary);">Driver: </span><strong>${drvName}</strong></div>
        <div style="font-size:0.82rem;"><span style="color:var(--text-secondary);">Phone: </span><strong style="color:var(--accent-cyan);">${drvPhone}</strong></div>
        <div style="font-size:0.82rem;"><span style="color:var(--text-secondary);">ETA: </span><strong style="color:var(--accent-amber);">${eta}</strong></div>
        ${r.verifiedKg!==null?`<div style="font-size:0.82rem;"><span style="color:var(--text-secondary);">Verified kg: </span><strong style="color:var(--accent-green);">${r.verifiedKg} kg ✓</strong></div>`:''}
      </div>
      ${(r.status==='On the Way'||r.status==='Driver Assigned')?`<div id="tracking-map"></div>`:''}
    </div>`;
  });
  wrap.innerHTML=html;

  // Init map for first active request
  const active=found.find(r=>r.status==='On the Way'||r.status==='Driver Assigned');
  if(active && document.getElementById('tracking-map')){
    initTrackingMap(active);
  }
}

function buildTimeline(currentStatus){
  const steps=STATUS_FLOW;
  const idx=steps.indexOf(currentStatus);
  return steps.map((step,i)=>{
    let cls='';
    if(i<idx) cls='done';
    else if(i===idx) cls='active';
    const icon=cls==='done'?'fa-check':(cls==='active'?'fa-circle-dot':'fa-circle');
    return `<div class="tl-step ${cls}">
      <div class="tl-dot"><i class="fa-solid ${icon}" style="font-size:0.65rem;"></i></div>
      <div class="tl-label">${step}</div>
    </div>`;
  }).join('');
}

function initTrackingMap(req){
  if(!window.L){ showToast('Map library not loaded yet.','error'); return; }
  const areaCoord=AREAS[req.area]||CENTER;
  trackingMap=L.map('tracking-map').setView([areaCoord.lat, areaCoord.lng],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap contributors', maxZoom:18
  }).addTo(trackingMap);

  // Pickup point marker
  L.marker([areaCoord.lat, areaCoord.lng])
    .addTo(trackingMap)
    .bindPopup(`<b>Pickup Point</b><br>${req.address}`)
    .openPopup();

  // Facility marker
  L.marker([CENTER.lat, CENTER.lng], {
    icon: L.divIcon({className:'',html:'<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:2px solid #fff;"></div>'})
  }).addTo(trackingMap).bindPopup('<b>Recycling Facility</b>');

  // Simulated driver marker starting ~2km away
  const drv=drivers.find(d=>d.id===req.driverId);
  let dLat=drv?drv.lat:(areaCoord.lat+0.015);
  let dLng=drv?drv.lng:(areaCoord.lng-0.010);

  const driverIcon=L.divIcon({
    className:'',
    html:'<div style="background:#f59e0b;width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px rgba(245,158,11,0.6);"></div>',
    iconSize:[16,16]
  });
  driverMarker=L.marker([dLat,dLng],{icon:driverIcon}).addTo(trackingMap)
    .bindPopup(`<b>Driver</b><br>${drv?drv.name:'En Route'}`);

  // Animate driver toward pickup
  const steps=60;
  let step=0;
  const dLatStep=(areaCoord.lat-dLat)/steps;
  const dLngStep=(areaCoord.lng-dLng)/steps;
  driverAnimInterval=setInterval(()=>{
    if(step>=steps){ clearInterval(driverAnimInterval); return; }
    dLat+=dLatStep; dLng+=dLngStep; step++;
    driverMarker.setLatLng([dLat,dLng]);
  },800);
}

// ── NGO ADMIN VIEW ────────────────────────────────────────────
function renderNGO(){
  renderNGOSummary();
  renderNGOTable();
  renderDriverAvailability();
  renderNGORoutes();
  renderNGOImpactChart();
}

function renderNGOSummary(){
  const total=requests.length;
  const pending=requests.filter(r=>r.status==='Requested').length;
  const inProgress=requests.filter(r=>['Driver Assigned','On the Way'].includes(r.status)).length;
  const done=requests.filter(r=>['Collected','Delivered to Facility','Verified'].includes(r.status)).length;
  const totalKg=requests.reduce((s,r)=>s+r.qty,0).toFixed(1);
  document.getElementById('ngo-summary').innerHTML=`
    <div class="summary-card"><div class="summary-icon cyan"><i class="fa-solid fa-inbox"></i></div><div class="summary-text"><div class="summary-value">${total}</div><div class="summary-label">Total Requests</div></div></div>
    <div class="summary-card"><div class="summary-icon amber"><i class="fa-solid fa-clock"></i></div><div class="summary-text"><div class="summary-value">${pending}</div><div class="summary-label">Awaiting Assignment</div></div></div>
    <div class="summary-card"><div class="summary-icon purple"><i class="fa-solid fa-truck-fast"></i></div><div class="summary-text"><div class="summary-value">${inProgress}</div><div class="summary-label">In Progress</div></div></div>
    <div class="summary-card"><div class="summary-icon green"><i class="fa-solid fa-circle-check"></i></div><div class="summary-text"><div class="summary-value">${done}</div><div class="summary-label">Completed</div></div></div>
    <div class="summary-card"><div class="summary-icon red"><i class="fa-solid fa-weight-scale"></i></div><div class="summary-text"><div class="summary-value">${totalKg} kg</div><div class="summary-label">Total E-Waste</div></div></div>`;
}

function renderNGOTable(){
  const sorted=[...requests].sort((a,b)=>priorityScore(b)-priorityScore(a));
  const rows=sorted.map(r=>{
    const ngoOpts=ngos.map(n=>`<option value="${n.id}" ${r.ngoId===n.id?'selected':''}>${n.name}</option>`).join('');
    const drvOpts=['<option value="">— Driver —</option>',...drivers.filter(d=>!r.ngoId||d.ngoId===r.ngoId).map(d=>`<option value="${d.id}" ${r.driverId===d.id?'selected':''}>${d.name}</option>`)].join('');
    const trClass=r.status==='Verified'?'verified':(r.status==='Collected'?'collected':'');
    return `<tr class="${trClass}">
      <td><strong>${r.id}</strong></td>
      <td>${r.name}</td>
      <td><i class="fa-solid fa-location-dot" style="color:var(--accent-cyan);font-size:0.72rem;margin-right:4px;"></i>${r.area}</td>
      <td>${r.type}</td>
      <td>${r.qty}</td>
      <td>${r.date}</td>
      <td><span class="badge badge-score">${priorityScore(r)}</span></td>
      <td>${statusBadge(r.status)}</td>
      <td>
        <div class="assign-row">
          <select onchange="assignNGO('${r.id}',this.value)">${ngoOpts}</select>
          <select onchange="assignDriver('${r.id}',this.value)">${drvOpts}</select>
        </div>
      </td>
    </tr>`;
  }).join('');
  document.getElementById('ngo-table-wrap').innerHTML=`
    <table>
      <thead><tr>
        <th>ID</th><th>Name</th><th>Area</th><th>Type</th><th>Qty</th><th>Date</th><th>Score</th><th>Status</th><th>Assign</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function assignNGO(reqId, ngoId){
  const r=requests.find(x=>x.id===reqId);
  if(!r) return;
  r.ngoId=ngoId||null;
  r.driverId=null; // reset driver when NGO changes
  if(ngoId && r.status==='Requested') r.status='Requested';
  saveAll();
  renderNGO();
  showToast(`NGO assigned to ${reqId}.`,'info');
}

function assignDriver(reqId, driverId){
  const r=requests.find(x=>x.id===reqId);
  if(!r) return;
  r.driverId=driverId||null;
  if(driverId && r.status==='Requested') r.status='Driver Assigned';
  saveAll();
  renderNGO();
  showToast(`Driver assigned to ${reqId}. Status → Driver Assigned.`,'success');
}

function renderDriverAvailability(){
  const wrap=document.getElementById('driver-avail');
  if(!wrap) return;
  wrap.innerHTML=`<div class="driver-grid">${drivers.map(d=>{
    const ngo=ngos.find(n=>n.id===d.ngoId);
    const myJobs=requests.filter(r=>r.driverId===d.id&&['Driver Assigned','On the Way'].includes(r.status)).length;
    return `<div class="driver-card">
      <div class="driver-avatar">${d.name[0]}</div>
      <div class="driver-info">
        <div class="driver-name">${d.name}</div>
        <div class="driver-ngo">${ngo?ngo.name:'Independent'}</div>
        <div class="driver-phone"><i class="fa-solid fa-phone" style="font-size:0.68rem;"></i> ${d.phone}</div>
        <div style="margin-top:6px;display:flex;gap:6px;align-items:center;">
          <span class="badge ${d.available?'badge-available':'badge-busy'}">${d.available?'Available':'Busy'}</span>
          ${myJobs>0?`<span style="font-size:0.72rem;color:var(--accent-amber);">${myJobs} active job(s)</span>`:''}
        </div>
      </div>
      <button class="btn btn-sm ${d.available?'btn-amber':'btn-primary'}" onclick="toggleDriverAvail('${d.id}')">
        ${d.available?'Set Busy':'Set Free'}
      </button>
    </div>`;
  }).join('')}</div>`;
}

function toggleDriverAvail(dId){
  const d=drivers.find(x=>x.id===dId);
  if(!d) return;
  d.available=!d.available;
  saveAll();
  renderDriverAvailability();
}

function renderNGORoutes(){
  const nd=parseInt(document.getElementById('p-drivers')?.value)||3;
  const cap=parseFloat(document.getElementById('p-capacity')?.value)||200;
  // reuse planRoutes logic but render into ngo panel
  _renderRoutes('ngo-route-output', nd, cap);
}

function renderNGOImpactChart(){
  const ctx=document.getElementById('ngo-impact-chart');
  if(!ctx) return;
  _renderImpactChart(ctx,'ngo-impact-stats');
}

// ── ROUTE PLANNING (shared logic) ────────────────────────────
function planNGORoutes(){
  const nd=parseInt(document.getElementById('p-drivers').value)||3;
  const cap=parseFloat(document.getElementById('p-capacity').value)||200;
  _renderRoutes('ngo-route-output',nd,cap);
  showToast(`Routes planned for ${nd} driver(s)!`);
}

function _renderRoutes(outId, numDrivers, capacity){
  const pending=[...requests]
    .filter(r=>r.status==='Requested'||r.status==='Driver Assigned')
    .sort((a,b)=>priorityScore(b)-priorityScore(a));
  if(!pending.length){
    document.getElementById(outId).innerHTML=`<div class="empty-state"><i class="fa-solid fa-truck-fast"></i><p>No pending requests to plan routes for.</p></div>`;
    return;
  }
  const unassigned=new Set(pending.map(r=>r.id));
  const routes=[];
  assignedIds=new Set();
  for(let d=0;d<numDrivers;d++){
    if(!unassigned.size) break;
    const stops=[]; let load=0; let lastPos=CENTER;
    const first=pending.find(r=>unassigned.has(r.id));
    if(!first) break;
    if(first.qty<=capacity){ stops.push(first); load+=first.qty; unassigned.delete(first.id); assignedIds.add(first.id); lastPos=AREAS[first.area]||CENTER; }
    let changed=true;
    while(changed&&unassigned.size){
      changed=false; let bestReq=null; let bestDist=Infinity;
      for(const rid of unassigned){
        const r=requests.find(x=>x.id===rid);
        if(!r||load+r.qty>capacity) continue;
        const aCoord=AREAS[r.area]||CENTER;
        const dist=haversine(lastPos,aCoord);
        if(dist<bestDist){ bestDist=dist; bestReq=r; }
      }
      if(bestReq){ stops.push(bestReq); load+=bestReq.qty; unassigned.delete(bestReq.id); assignedIds.add(bestReq.id); lastPos=AREAS[bestReq.area]||CENTER; changed=true; }
    }
    let km=0; let cur=CENTER;
    for(const s of stops){ km+=haversine(cur,AREAS[s.area]||CENTER); cur=AREAS[s.area]||CENTER; }
    km+=haversine(cur,CENTER);

    // Find named driver for this slot
    const slotDrivers=drivers.filter(d=>d.available);
    const namedDrv=slotDrivers[d]||null;

    routes.push({driver:d+1, namedDrv, stops, load, km:km.toFixed(1)});
  }
  let html=`<div class="route-grid">`;
  for(const route of routes){
    const fp=[`<span class="route-center"><i class="fa-solid fa-warehouse"></i> Facility</span>`];
    route.stops.forEach(s=>{ fp.push(`<span class="route-arrow">→</span>`); fp.push(`<span class="route-stop">${s.area}</span>`); });
    fp.push(`<span class="route-arrow">→</span><span class="route-center"><i class="fa-solid fa-warehouse"></i> Facility</span>`);
    html+=`<div class="route-card">
      <div class="route-card-header">
        <div class="driver-avatar">${route.namedDrv?route.namedDrv.name[0]:'D'+route.driver}</div>
        <div>
          <div style="font-weight:700;">${route.namedDrv?route.namedDrv.name:'Driver '+route.driver}</div>
          <div style="font-size:0.76rem;color:var(--text-secondary);">${route.stops.length} stop(s)</div>
        </div>
      </div>
      <div class="route-meta">
        <div class="route-meta-item">Load: <span>${route.load.toFixed(1)} kg / ${capacity} kg</span></div>
        <div class="route-meta-item">Distance: <span>${route.km} km</span></div>
      </div>
      <div class="route-stops" style="margin-bottom:12px;">${fp.join('')}</div>
      <div>${route.stops.map((s,i)=>`<div class="stop-detail">
        <div class="stop-detail-left">
          <div><span class="stop-idx">${i+1}</span><strong>${s.area}</strong> &nbsp;·&nbsp; <small style="color:var(--text-secondary);">${s.id}</small></div>
          <div style="font-size:0.75rem;color:var(--text-secondary);padding-left:25px;">${s.address.substring(0,42)}${s.address.length>42?'…':''}</div>
        </div>
        <div style="font-size:0.8rem;color:var(--accent-amber);font-weight:700;">${s.qty} kg</div>
      </div>`).join('')}</div>
    </div>`;
  }
  html+=`</div>`;
  document.getElementById(outId).innerHTML=html;
}

function markNGOCollected(){
  if(!assignedIds.size){ showToast('Plan routes first.','error'); return; }
  let count=0;
  requests.forEach(r=>{ if(assignedIds.has(r.id)&&['Requested','Driver Assigned'].includes(r.status)){ r.status='Collected'; count++; } });
  assignedIds.clear(); saveAll(); renderNGO();
  showToast(`${count} request(s) marked as Collected!`);
}

// ── DRIVER VIEW ───────────────────────────────────────────────
function renderDriver(){
  const dId=DEMO_USERS.driver.driverId;
  const myJobs=requests.filter(r=>r.driverId===dId&&!['Verified'].includes(r.status));
  const wrap=document.getElementById('driver-jobs');
  if(!wrap) return;
  if(!myJobs.length){
    wrap.innerHTML=`<div class="empty-state"><i class="fa-solid fa-truck"></i><p>No jobs assigned to you yet. (Demo driver: ${dId})</p></div>`;
    return;
  }
  wrap.innerHTML=myJobs.map(r=>{
    const canAccept=r.status==='Driver Assigned';
    const canPickup=r.status==='On the Way';
    const canDeliver=r.status==='Collected';
    return `<div class="job-card">
      <div class="job-card-header">
        <div>
          <strong>${r.id}</strong> &nbsp; ${statusBadge(r.status)}
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;">${r.type} · ${r.qty} kg · ${r.area}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">${r.address}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">Date: ${r.date} | Time: ${r.time}</div>
        </div>
        <div class="job-actions">
          ${canAccept?`<button class="btn btn-cyan btn-sm" onclick="driverAction('${r.id}','On the Way')"><i class="fa-solid fa-thumbs-up"></i> Accept</button>`:''}
          ${canPickup?`<button class="btn btn-amber btn-sm" onclick="driverAction('${r.id}','Collected')"><i class="fa-solid fa-box-archive"></i> Picked Up</button>`:''}
          ${canDeliver?`<button class="btn btn-primary btn-sm" onclick="driverAction('${r.id}','Delivered to Facility')"><i class="fa-solid fa-warehouse"></i> Delivered</button>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function driverAction(reqId, newStatus){
  const r=requests.find(x=>x.id===reqId);
  if(!r) return;
  r.status=newStatus;
  if(newStatus==='Collected') r.points=(r.points||0)+10;
  saveAll(); renderDriver();
  showToast(`Request ${reqId} updated to "${newStatus}"!`,'success');
}

// ── DISTRICT AUTHORITY VIEW ───────────────────────────────────
function renderAuthority(){
  const district=document.getElementById('district-select')?.value||'Chengalpattu';
  renderDistrictSummary(district);
  renderFacilityVerify(district);
  renderDistrictCharts(district);
  renderImpactCounters();
}

function renderDistrictSummary(district){
  const dr=requests.filter(r=>r.district===district);
  const totalPU=dr.length;
  const totalKg=dr.reduce((s,r)=>s+r.qty,0).toFixed(1);
  const verKg=dr.reduce((s,r)=>s+(r.verifiedKg||0),0).toFixed(1);
  const pending=dr.filter(r=>r.status==='Requested').length;
  const intake=dr.filter(r=>['Delivered to Facility','Verified'].includes(r.status)).length;
  document.getElementById('auth-summary').innerHTML=`
    <div class="summary-card"><div class="summary-icon cyan"><i class="fa-solid fa-inbox"></i></div><div class="summary-text"><div class="summary-value">${totalPU}</div><div class="summary-label">Total Pickups</div></div></div>
    <div class="summary-card"><div class="summary-icon red"><i class="fa-solid fa-weight-scale"></i></div><div class="summary-text"><div class="summary-value">${totalKg} kg</div><div class="summary-label">kg Collected</div></div></div>
    <div class="summary-card"><div class="summary-icon green"><i class="fa-solid fa-shield-check"></i></div><div class="summary-text"><div class="summary-value">${verKg} kg</div><div class="summary-label">Verified kg</div></div></div>
    <div class="summary-card"><div class="summary-icon amber"><i class="fa-solid fa-clock"></i></div><div class="summary-text"><div class="summary-value">${pending}</div><div class="summary-label">Pending</div></div></div>
    <div class="summary-card"><div class="summary-icon purple"><i class="fa-solid fa-warehouse"></i></div><div class="summary-text"><div class="summary-value">${intake}</div><div class="summary-label">Facility Intake</div></div></div>`;
}

function renderFacilityVerify(district){
  const toVerify=requests.filter(r=>r.district===district&&r.status==='Delivered to Facility');
  const wrap=document.getElementById('verify-wrap');
  if(!wrap) return;
  if(!toVerify.length){
    wrap.innerHTML=`<div class="empty-state"><i class="fa-solid fa-clipboard-check"></i><p>No batches pending verification for ${district}.</p></div>`;
    return;
  }
  wrap.innerHTML=toVerify.map(r=>`
    <div class="verify-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <div>
          <strong>${r.id}</strong> &nbsp; <span style="font-size:0.82rem;color:var(--text-secondary);">${r.type} · declared ${r.qty} kg · ${r.area}</span>
          <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:3px;">Name: ${r.name} | Driver: ${drivers.find(d=>d.id===r.driverId)?.name||'—'}</div>
        </div>
        <span class="badge badge-delivered">Awaiting Verification</span>
      </div>
      <div class="verify-row">
        <label style="font-size:0.8rem;color:var(--text-secondary);">Weighed kg:</label>
        <input type="number" id="vkg-${r.id}" min="0" step="0.5" placeholder="Enter actual kg" value="${r.qty}"/>
        <button class="btn btn-primary btn-sm" onclick="verifyBatch('${r.id}')">
          <i class="fa-solid fa-shield-check"></i> Verify & Record
        </button>
      </div>
    </div>`).join('');
}

function verifyBatch(reqId){
  const r=requests.find(x=>x.id===reqId);
  if(!r) return;
  const vkgEl=document.getElementById(`vkg-${reqId}`);
  const vkg=parseFloat(vkgEl?.value);
  if(isNaN(vkg)||vkg<0){ showToast('Enter a valid weight.','error'); return; }
  r.verifiedKg=vkg;
  r.status='Verified';
  r.points=Math.round(vkg*10); // 10 pts per verified kg
  saveAll();
  renderAuthority();
  showToast(`Batch ${reqId} verified: ${vkg} kg. Points awarded!`,'success');
}

function renderDistrictCharts(district){
  const dr=requests.filter(r=>r.district===district);

  // --- Chart 1: kg by area ---
  const areaMap={};
  dr.forEach(r=>{ areaMap[r.area]=(areaMap[r.area]||0)+r.qty; });
  const areaLabels=Object.keys(areaMap);
  const areaData=areaLabels.map(a=>areaMap[a]);

  const ctx1=document.getElementById('chart-area');
  if(ctx1){
    if(districtCharts.area) districtCharts.area.destroy();
    districtCharts.area=new Chart(ctx1,{
      type:'bar',
      data:{ labels:areaLabels, datasets:[{ label:'kg Collected', data:areaData, backgroundColor:'rgba(6,182,212,0.6)', borderColor:'#06b6d4', borderWidth:1.5 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#94a3b8' } } }, scales:{ x:{ ticks:{ color:'#94a3b8', font:{size:10} }, grid:{ color:'rgba(255,255,255,0.05)' } }, y:{ ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)' }, beginAtZero:true } } }
    });
  }

  // --- Chart 2: kg by type ---
  const typeMap={};
  dr.forEach(r=>{ typeMap[r.type]=(typeMap[r.type]||0)+r.qty; });
  const typeLabels=Object.keys(typeMap);
  const typeData=typeLabels.map(t=>typeMap[t]);
  const palette=['#06b6d4','#22c55e','#f59e0b','#ef4444','#a855f7','#ec4899'];

  const ctx2=document.getElementById('chart-type');
  if(ctx2){
    if(districtCharts.type) districtCharts.type.destroy();
    districtCharts.type=new Chart(ctx2,{
      type:'doughnut',
      data:{ labels:typeLabels, datasets:[{ data:typeData, backgroundColor:palette, borderColor:'rgba(255,255,255,0.1)', borderWidth:1 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ color:'#94a3b8', font:{size:11}, padding:12 } } } }
    });
  }

  // --- Chart 3: pickups per week (last 4 weeks) ---
  const weekLabels=['Week 1','Week 2','Week 3','Week 4'];
  const weekData=[4,7,11,dr.length]; // simulated + current
  const ctx3=document.getElementById('chart-weekly');
  if(ctx3){
    if(districtCharts.weekly) districtCharts.weekly.destroy();
    districtCharts.weekly=new Chart(ctx3,{
      type:'line',
      data:{ labels:weekLabels, datasets:[{ label:'Pickups', data:weekData, borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,0.1)', borderWidth:2.5, pointBackgroundColor:'#22c55e', pointRadius:5, tension:0.4, fill:true }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#94a3b8' } } }, scales:{ x:{ ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)' } }, y:{ ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)' }, beginAtZero:true } } }
    });
  }

  // --- Area-wise stat bars ---
  renderAreaStatBars(district);
}

function renderAreaStatBars(district){
  const dr=requests.filter(r=>r.district===district);
  const areaMap={};
  dr.forEach(r=>{ areaMap[r.area]=(areaMap[r.area]||0)+r.qty; });
  const max=Math.max(...Object.values(areaMap),1);
  const wrap=document.getElementById('area-stat-bars');
  if(!wrap) return;
  wrap.innerHTML=Object.entries(areaMap)
    .sort((a,b)=>b[1]-a[1])
    .map(([area,kg])=>`
      <div class="area-stat-row">
        <span style="font-size:0.82rem;min-width:150px;color:var(--text-primary);">${area}</span>
        <div class="area-bar-wrap"><div class="area-bar" style="width:${Math.round(kg/max*100)}%;"></div></div>
        <span style="font-size:0.82rem;font-weight:700;color:var(--accent-cyan);min-width:60px;text-align:right;">${kg} kg</span>
      </div>`).join('');
}

function renderImpactCounters(){
  const totalVKg=requests.reduce((s,r)=>s+(r.verifiedKg||0),0);
  const toxicSaved=(totalVKg*0.012).toFixed(2); // ~1.2% toxic metals estimate
  const co2Saved=(totalVKg*2.1).toFixed(1); // ~2.1 kg CO2 per kg e-waste estimate
  const el=document.getElementById('impact-counters');
  if(!el) return;
  el.innerHTML=`
    <div class="impact-stat"><div class="impact-stat-label"><i class="fa-solid fa-recycle"></i> Total kg Diverted (Estimated)</div><div class="impact-stat-value green">${totalVKg.toFixed(1)} kg</div><div style="font-size:0.76rem;color:var(--text-secondary);margin-top:4px;">Based on facility-verified weights only</div></div>
    <div class="impact-stat"><div class="impact-stat-label"><i class="fa-solid fa-flask"></i> Toxic Metals Avoided (Estimated)</div><div class="impact-stat-value amber">${toxicSaved} kg</div><div style="font-size:0.76rem;color:var(--text-secondary);margin-top:4px;">~1.2% toxic metal content estimate</div></div>
    <div class="impact-stat"><div class="impact-stat-label"><i class="fa-solid fa-leaf"></i> CO₂ Savings (Estimated)</div><div class="impact-stat-value cyan">${co2Saved} kg</div><div style="font-size:0.76rem;color:var(--text-secondary);margin-top:4px;">~2.1 kg CO₂ per kg e-waste recycled</div></div>`;
}

// ── NGO IMPACT CHART (reused in NGO view) ────────────────────
function _renderImpactChart(ctx, statsId){
  const labels=[];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    labels.push(d.toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'}));
  }
  const ucData=[340,295,278,242,198,152,118];
  const cData=[40,92,135,180,230,284,330];
  if(impactChart) impactChart.destroy();
  impactChart=new Chart(ctx,{
    type:'line',
    data:{ labels, datasets:[
      { label:'Uncollected E-Waste (kg)', data:ucData, borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,0.08)', borderWidth:2.5, pointBackgroundColor:'#f59e0b', pointRadius:5, tension:0.4, fill:true },
      { label:'Collected E-Waste (kg)',   data:cData,  borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,0.08)',  borderWidth:2.5, pointBackgroundColor:'#22c55e', pointRadius:5, tension:0.4, fill:true }
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ color:'#94a3b8', font:{size:12} } }, tooltip:{ backgroundColor:'rgba(17,24,39,0.95)', borderColor:'rgba(255,255,255,0.1)', borderWidth:1, titleColor:'#f1f5f9', bodyColor:'#94a3b8' } },
      scales:{ x:{ ticks:{ color:'#94a3b8', font:{size:11} }, grid:{ color:'rgba(255,255,255,0.05)' } }, y:{ ticks:{ color:'#94a3b8', font:{size:11} }, grid:{ color:'rgba(255,255,255,0.05)' }, beginAtZero:true } }
    }
  });
  const totalGen=ucData[6]+cData[6]; const collRate=Math.round(cData[6]/totalGen*100);
  const reduction=Math.round((ucData[0]-ucData[6])/ucData[0]*100);
  const el=document.getElementById(statsId);
  if(!el) return;
  el.innerHTML=`
    <div class="impact-stat"><div class="impact-stat-label"><i class="fa-solid fa-percent"></i> Collection Rate</div><div class="impact-stat-value green">${collRate}%</div><div style="font-size:0.76rem;color:var(--text-secondary);margin-top:3px;">of generated e-waste collected this week</div></div>
    <div class="impact-stat"><div class="impact-stat-label"><i class="fa-solid fa-arrow-trend-down"></i> Reduction from Peak</div><div class="impact-stat-value cyan">${reduction}%</div><div style="font-size:0.76rem;color:var(--text-secondary);margin-top:3px;">uncollected waste reduced (${ucData[0]} kg → ${ucData[6]} kg)</div></div>
    <div class="impact-stat"><div class="impact-stat-label"><i class="fa-solid fa-recycle"></i> Total Recovered</div><div class="impact-stat-value green">${cData[6]} kg</div><div style="font-size:0.76rem;color:var(--text-secondary);margin-top:3px;">safely recovered & processed</div></div>`;
}

// ── LEADERBOARD ───────────────────────────────────────────────
function getLeaderboardData(area){
  // Aggregate by nickname within area, using verified kg + points
  const map={};
  requests.filter(r=>(!area||r.area===area)&&(r.verifiedKg!==null||r.points>0)).forEach(r=>{
    if(!map[r.nickname]) map[r.nickname]={ nickname:r.nickname, phone:r.phone, area:r.area, verifiedKg:0, items:0, points:0 };
    map[r.nickname].verifiedKg+=(r.verifiedKg||0);
    map[r.nickname].items+=1;
    map[r.nickname].points+=(r.points||0);
  });
  return Object.values(map).sort((a,b)=>b.verifiedKg-a.verifiedKg||b.points-a.points);
}

function renderLeaderboard(){
  const areaFilter=document.getElementById('lb-area-filter')?.value||'';
  const data=getLeaderboardData(areaFilter).slice(0,10);
  const wrap=document.getElementById('lb-wrap');

  const { cycleLabel, daysLeft, prize }=getRewardCycleInfo();

  // Cycle box
  document.getElementById('cycle-box').innerHTML=`
    <div class="cycle-item"><span class="cycle-item-label">Current Cycle</span><span class="cycle-item-value">${cycleLabel}</span></div>
    <div class="cycle-item"><span class="cycle-item-label">Next Reward In</span><span class="cycle-item-value" style="color:var(--accent-amber);">${daysLeft} days</span></div>
    <div class="cycle-item"><span class="cycle-item-label">Prize (Demo)</span><span class="cycle-item-value" style="font-size:0.95rem;">${prize}</span></div>
    <div class="cycle-item"><span class="cycle-item-label">Cap</span><span class="cycle-item-value" style="font-size:0.9rem;">1 reward / household / cycle</span></div>`;

  if(!data.length){
    wrap.innerHTML=`<div class="empty-state"><i class="fa-solid fa-trophy"></i><p>No verified contributions yet for this area. Be the first!</p></div>`;
  } else {
    wrap.innerHTML=data.map((u,i)=>{
      const rankCls=i===0?'gold':i===1?'silver':i===2?'bronze':'other';
      return `<div class="lb-row">
        <div class="lb-rank ${rankCls}">${i+1}</div>
        <div>
          <div class="lb-nick">${u.nickname} ${i<3?['🥇','🥈','🥉'][i]:''}</div>
          <div class="lb-area">${u.area} · ${u.items} item(s)</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
          <div class="lb-kg">${u.verifiedKg.toFixed(1)} kg</div>
          <div class="lb-pts">${u.points} pts</div>
        </div>
      </div>`;
    }).join('');
  }

  // Previous winners
  renderPrevWinners();
}

function renderPrevWinners(){
  const wrap=document.getElementById('prev-winners-wrap');
  if(!wrap) return;
  wrap.innerHTML=prevWinners.map(w=>`
    <tr>
      <td>${w.cycle}</td>
      <td>${w.area}</td>
      <td><strong>${w.nickname}</strong></td>
      <td style="color:var(--accent-green);">${w.verifiedKg} kg</td>
      <td style="color:var(--accent-amber);">${w.prize}</td>
    </tr>`).join('');
}

// ── DISTRICT SELECT CHANGE ────────────────────────────────────
function onDistrictChange(){
  renderAuthority();
}

// ── LEADERBOARD AREA FILTER CHANGE ───────────────────────────
function onLBAreaChange(){
  renderLeaderboard();
}

// Expose switchTab globally for inline onclick in HTML
window.switchTab = switchTab;
