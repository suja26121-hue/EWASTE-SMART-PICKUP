// ============================================================
//  data.js — DEMO SEED DATA  |  Smart E-Waste Collection Portal
//  All data is clearly labelled DEMO / sample data.
//  Loaded once on first visit; stored in localStorage.
// ============================================================

const AREAS = {
  "Chengalpattu Town":  { lat: 12.6919, lng: 79.9762 },
  "Maraimalai Nagar":   { lat: 12.7953, lng: 80.0256 },
  "Vandalur":           { lat: 12.9217, lng: 80.0786 },
  "Guduvanchery":       { lat: 12.8454, lng: 79.9897 },
  "Tambaram":           { lat: 12.9249, lng: 80.1000 },
  "Perungalathur":      { lat: 12.8882, lng: 80.0769 },
  "Pallavaram":         { lat: 12.9675, lng: 80.1507 },
  "Urapakkam":          { lat: 12.8743, lng: 80.0590 },
  "Singaperumal Koil":  { lat: 12.7602, lng: 79.9584 },
  "Kancheepuram":       { lat: 12.8342, lng: 79.7034 }
};
const CENTER = { lat: 12.6919, lng: 79.9762, name: "Green Recycling Facility" };

const DISTRICTS = ["Chengalpattu", "Kancheepuram", "Chennai"];

const EWASTE_TYPES = [
  "Phones & Tablets",
  "Computers & Laptops",
  "Batteries",
  "Televisions & Monitors",
  "Home Appliances",
  "Mixed E-Waste"
];

// ── DEMO NGOs ────────────────────────────────────────────────
const SEED_NGOS = [
  { id: "NGO-01", name: "GreenEarth Foundation",   contact: "9500001111", district: "Chengalpattu" },
  { id: "NGO-02", name: "EcoRevive Tamil Nadu",     contact: "9500002222", district: "Kancheepuram" },
  { id: "NGO-03", name: "CleanCycle Chennai",       contact: "9500003333", district: "Chennai" }
];

// ── DEMO DRIVERS ─────────────────────────────────────────────
const SEED_DRIVERS = [
  { id: "DRV-01", name: "Arjun Selvam",    phone: "9600001111", ngoId: "NGO-01", available: true,  lat: 12.730, lng: 79.980 },
  { id: "DRV-02", name: "Balamurugan K",   phone: "9600002222", ngoId: "NGO-01", available: true,  lat: 12.800, lng: 80.030 },
  { id: "DRV-03", name: "Chandrasekar R",  phone: "9600003333", ngoId: "NGO-02", available: false, lat: 12.845, lng: 79.980 },
  { id: "DRV-04", name: "Durai Murugan",   phone: "9600004444", ngoId: "NGO-02", available: true,  lat: 12.850, lng: 79.990 },
  { id: "DRV-05", name: "Ezhilmaran P",    phone: "9600005555", ngoId: "NGO-03", available: true,  lat: 12.900, lng: 80.100 }
];

// ── STATUS FLOW ───────────────────────────────────────────────
const STATUS_FLOW = [
  "Requested",
  "Driver Assigned",
  "On the Way",
  "Collected",
  "Delivered to Facility",
  "Verified"
];

// ── HELPER DATE UTILS ─────────────────────────────────────────
function _today() { return new Date().toISOString().split('T')[0]; }
function _addDays(d, n) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split('T')[0];
}

// ── SEED REQUESTS (30 entries) ────────────────────────────────
function buildSeedRequests() {
  const td = _today();
  return [
    // --- Tambaram cluster ---
    { id:'EW-001', name:'Muruganantham S',  nickname:'EcoHero_01',   phone:'9876543210', area:'Tambaram',          address:'14, Gandhi Nagar, 3rd Cross',       type:'Computers & Laptops',    qty:18, date:_addDays(td,0), time:'Morning 8–12',    status:'Driver Assigned',    ngoId:'NGO-01', driverId:'DRV-01', verifiedKg:null, district:'Chengalpattu', points:90,  wardBatch:false, photoUrl:'' },
    { id:'EW-002', name:'Kavitha R',        nickname:'GreenStar_02', phone:'9823456780', area:'Pallavaram',         address:'7, Anna Salai, Flat 3B',            type:'Batteries',              qty:12, date:_addDays(td,1), time:'Afternoon 12–4', status:'On the Way',         ngoId:'NGO-01', driverId:'DRV-02', verifiedKg:12,   district:'Chengalpattu', points:120, wardBatch:false, photoUrl:'' },
    { id:'EW-003', name:'Senthilkumar P',   nickname:'WasteZero_03', phone:'9734512309', area:'Vandalur',           address:'22, Nehru St, Near Park',           type:'Home Appliances',        qty:35, date:_addDays(td,2), time:'Morning 8–12',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:30,  wardBatch:true,  photoUrl:'' },
    { id:'EW-004', name:'Priya Lakshmi',    nickname:'ECO_Queen_04', phone:'9612345678', area:'Guduvanchery',       address:'5B, LIG Colony, Block 2',           type:'Phones & Tablets',       qty:6,  date:_addDays(td,1), time:'Evening 4–7',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:20,  wardBatch:true,  photoUrl:'' },
    { id:'EW-005', name:'Anbalagan M',      nickname:'SaveIT_05',    phone:'9500123456', area:'Maraimalai Nagar',   address:'Plot 9, Rajiv Nagar',               type:'Batteries',              qty:20, date:_addDays(td,0), time:'Morning 8–12',    status:'Collected',          ngoId:'NGO-01', driverId:'DRV-01', verifiedKg:null, district:'Chengalpattu', points:60,  wardBatch:false, photoUrl:'' },
    { id:'EW-006', name:'Deepa Selvi',      nickname:'BlueEarth_06', phone:'9445678901', area:'Urapakkam',          address:'12, Teachers Colony',               type:'Televisions & Monitors', qty:40, date:_addDays(td,3), time:'Afternoon 12–4', status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:10,  wardBatch:false, photoUrl:'' },
    { id:'EW-007', name:'Rajendran K',      nickname:'RecyclePro_07',phone:'9345678012', area:'Perungalathur',      address:'8, Patel Rd, 1st Lane',             type:'Mixed E-Waste',          qty:15, date:_addDays(td,2), time:'Morning 8–12',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:15,  wardBatch:true,  photoUrl:'' },
    { id:'EW-008', name:'Sumathi V',        nickname:'GreenLeaf_08', phone:'9234560123', area:'Singaperumal Koil',  address:'3, Vel Nagar, East St',             type:'Batteries',              qty:8,  date:_addDays(td,1), time:'Evening 4–7',    status:'Delivered to Facility',ngoId:'NGO-02', driverId:'DRV-03', verifiedKg:null, district:'Kancheepuram', points:50,  wardBatch:false, photoUrl:'' },
    { id:'EW-009', name:'Karthikeyan J',    nickname:'EcoKing_09',   phone:'9123456780', area:'Kancheepuram',       address:'17, Sivaganga St, Old Town',        type:'Home Appliances',        qty:50, date:_addDays(td,4), time:'Morning 8–12',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Kancheepuram', points:10,  wardBatch:false, photoUrl:'' },
    { id:'EW-010', name:'Meenakshi A',      nickname:'EarthSaver_10',phone:'9012345678', area:'Tambaram',           address:'45, Bharathi Nagar, 5th Cross',     type:'Phones & Tablets',       qty:5,  date:_addDays(td,5), time:'Afternoon 12–4', status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:5,   wardBatch:true,  photoUrl:'' },
    { id:'EW-011', name:'Velmurugan D',     nickname:'TechDown_11',  phone:'8998765432', area:'Pallavaram',         address:'2, Sri Nagar, Cross Rd',            type:'Computers & Laptops',    qty:22, date:_addDays(td,3), time:'Morning 8–12',    status:'Verified',           ngoId:'NGO-03', driverId:'DRV-05', verifiedKg:21,   district:'Chennai',      points:210, wardBatch:false, photoUrl:'' },
    { id:'EW-012', name:'Saranya T',        nickname:'CleanCity_12', phone:'8887654321', area:'Vandalur',           address:'10, Lotus Nagar, 2nd St',           type:'Mixed E-Waste',          qty:9,  date:_addDays(td,6), time:'Evening 4–7',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:5,   wardBatch:false, photoUrl:'' },
    // --- More requests ---
    { id:'EW-013', name:'Ilango R',         nickname:'IlaGreen_13',  phone:'8776543210', area:'Tambaram',           address:'33, Nehru Colony, 4th St',          type:'Batteries',              qty:14, date:_addDays(td,1), time:'Morning 8–12',    status:'Collected',          ngoId:'NGO-01', driverId:'DRV-02', verifiedKg:14,   district:'Chengalpattu', points:140, wardBatch:false, photoUrl:'' },
    { id:'EW-014', name:'Jayalakshmi S',    nickname:'JayaEco_14',   phone:'8665432109', area:'Guduvanchery',       address:'11, MG Road, Plot 7',               type:'Phones & Tablets',       qty:3,  date:_addDays(td,2), time:'Evening 4–7',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:3,   wardBatch:true,  photoUrl:'' },
    { id:'EW-015', name:'Krishnamurthy B',  nickname:'KrishRec_15',  phone:'8554321098', area:'Urapakkam',          address:'88, East Car St',                   type:'Televisions & Monitors', qty:30, date:_addDays(td,0), time:'Afternoon 12–4', status:'Driver Assigned',    ngoId:'NGO-01', driverId:'DRV-01', verifiedKg:null, district:'Chengalpattu', points:60,  wardBatch:false, photoUrl:'' },
    { id:'EW-016', name:'Lavanya P',        nickname:'LavEarth_16',  phone:'8443210987', area:'Perungalathur',      address:'5, Kamaraj Nagar',                  type:'Home Appliances',        qty:25, date:_addDays(td,2), time:'Morning 8–12',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:10,  wardBatch:true,  photoUrl:'' },
    { id:'EW-017', name:'Manimaran C',      nickname:'ManiGo_17',    phone:'8332109876', area:'Maraimalai Nagar',   address:'Plot 20, Vinayagar St',             type:'Mixed E-Waste',          qty:11, date:_addDays(td,3), time:'Evening 4–7',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:5,   wardBatch:false, photoUrl:'' },
    { id:'EW-018', name:'Nivetha G',        nickname:'NivEco_18',    phone:'8220987654', area:'Kancheepuram',       address:'2, Temple View Rd',                 type:'Batteries',              qty:7,  date:_addDays(td,1), time:'Morning 8–12',    status:'Verified',           ngoId:'NGO-02', driverId:'DRV-04', verifiedKg:7,    district:'Kancheepuram', points:70,  wardBatch:false, photoUrl:'' },
    { id:'EW-019', name:'Prabakaran V',     nickname:'PrabGreen_19', phone:'8109876543', area:'Singaperumal Koil',  address:'7, Mullai Nagar, West St',          type:'Computers & Laptops',    qty:16, date:_addDays(td,4), time:'Afternoon 12–4', status:'On the Way',         ngoId:'NGO-02', driverId:'DRV-04', verifiedKg:null, district:'Kancheepuram', points:40,  wardBatch:false, photoUrl:'' },
    { id:'EW-020', name:'Radhika M',        nickname:'RadEarth_20',  phone:'7998765432', area:'Pallavaram',         address:'19, Green Park Layout',             type:'Mixed E-Waste',          qty:13, date:_addDays(td,2), time:'Morning 8–12',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chennai',      points:5,   wardBatch:true,  photoUrl:'' },
    { id:'EW-021', name:'Suresh Kumar A',   nickname:'SurEco_21',    phone:'7887654321', area:'Tambaram',           address:'62, Anna Nagar West',               type:'Phones & Tablets',       qty:9,  date:_addDays(td,0), time:'Evening 4–7',    status:'Delivered to Facility',ngoId:'NGO-03', driverId:'DRV-05', verifiedKg:null, district:'Chennai',      points:40,  wardBatch:false, photoUrl:'' },
    { id:'EW-022', name:'Thenmozhi K',      nickname:'ThenRec_22',   phone:'7776543210', area:'Vandalur',           address:'4, New Colony, 1st Cross',          type:'Home Appliances',        qty:28, date:_addDays(td,5), time:'Afternoon 12–4', status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:5,   wardBatch:false, photoUrl:'' },
    { id:'EW-023', name:'Uma Shankar P',    nickname:'UmaGo_23',     phone:'7665432109', area:'Guduvanchery',       address:'8, Perumal Nagar, 3rd Lane',        type:'Computers & Laptops',    qty:19, date:_addDays(td,1), time:'Morning 8–12',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:10,  wardBatch:true,  photoUrl:'' },
    { id:'EW-024', name:'Vignesh S',        nickname:'VigEco_24',    phone:'7554321098', area:'Urapakkam',          address:'56, Vivekananda St',                type:'Batteries',              qty:5,  date:_addDays(td,3), time:'Evening 4–7',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:5,   wardBatch:false, photoUrl:'' },
    { id:'EW-025', name:'Yamuna Devi',      nickname:'YamRec_25',    phone:'7443210987', area:'Perungalathur',      address:'3, Lotus Colony, South Ext',        type:'Televisions & Monitors', qty:33, date:_addDays(td,2), time:'Morning 8–12',    status:'Collected',          ngoId:'NGO-01', driverId:'DRV-02', verifiedKg:33,   district:'Chengalpattu', points:165, wardBatch:false, photoUrl:'' },
    { id:'EW-026', name:'Ashwin Kumar',     nickname:'AshEco_26',    phone:'7332109876', area:'Maraimalai Nagar',   address:'Plot 3A, Tech Park Layout',         type:'Computers & Laptops',    qty:24, date:_addDays(td,0), time:'Afternoon 12–4', status:'Verified',           ngoId:'NGO-01', driverId:'DRV-01', verifiedKg:23,   district:'Chengalpattu', points:230, wardBatch:false, photoUrl:'' },
    { id:'EW-027', name:'Bhuvaneswari T',   nickname:'BhuRec_27',    phone:'7220987654', area:'Kancheepuram',       address:'10, Perumal Koil St, Ward 5',       type:'Phones & Tablets',       qty:4,  date:_addDays(td,4), time:'Evening 4–7',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Kancheepuram', points:4,   wardBatch:true,  photoUrl:'' },
    { id:'EW-028', name:'Chitra N',         nickname:'ChiGreen_28',  phone:'7109876543', area:'Singaperumal Koil',  address:'21, Ambedkar Rd, East End',         type:'Home Appliances',        qty:42, date:_addDays(td,1), time:'Morning 8–12',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Kancheepuram', points:10,  wardBatch:false, photoUrl:'' },
    { id:'EW-029', name:'Dinesh Babu',      nickname:'DinEco_29',    phone:'6998765432', area:'Pallavaram',         address:'88, New Scheme Rd',                 type:'Mixed E-Waste',          qty:17, date:_addDays(td,3), time:'Afternoon 12–4', status:'Driver Assigned',    ngoId:'NGO-03', driverId:'DRV-05', verifiedKg:null, district:'Chennai',      points:30,  wardBatch:true,  photoUrl:'' },
    { id:'EW-030', name:'Eswari R',         nickname:'EswGo_30',     phone:'6887654321', area:'Tambaram',           address:'77, Dr Ambedkar St, 2nd Lane',      type:'Batteries',              qty:10, date:_addDays(td,5), time:'Morning 8–12',    status:'Requested',          ngoId:null,     driverId:null,     verifiedKg:null, district:'Chengalpattu', points:5,   wardBatch:false, photoUrl:'' }
  ];
}

// ── PREVIOUS WINNERS (sample) ─────────────────────────────────
const SEED_PREV_WINNERS = [
  { cycle:"Sep–Oct 2026", area:"Tambaram",         nickname:"GreenStar_02", verifiedKg:85, prize:"₹500 Amazon Voucher (Sponsor: GreenLeaf Inc.)" },
  { cycle:"Sep–Oct 2026", area:"Pallavaram",        nickname:"TechDown_11",  verifiedKg:68, prize:"₹500 Amazon Voucher (Sponsor: GreenLeaf Inc.)" },
  { cycle:"Sep–Oct 2026", area:"Kancheepuram",      nickname:"NivEco_18",    verifiedKg:52, prize:"₹500 Amazon Voucher (Sponsor: GreenLeaf Inc.)" },
  { cycle:"Jul–Aug 2026", area:"Tambaram",          nickname:"EcoHero_01",   verifiedKg:76, prize:"₹500 Flipkart Voucher (Sponsor: RecycleTech)" },
  { cycle:"Jul–Aug 2026", area:"Maraimalai Nagar",  nickname:"AshEco_26",    verifiedKg:91, prize:"₹500 Flipkart Voucher (Sponsor: RecycleTech)" }
];

// ── REWARD CYCLE CONFIG ───────────────────────────────────────
function getRewardCycleInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  // Cycles: Jan-Feb, Mar-Apr, May-Jun, Jul-Aug, Sep-Oct, Nov-Dec
  const cycleStart = month - (month % 2);
  const cycleEndMonth = cycleStart + 1;
  const cycleEndDate = new Date(year, cycleEndMonth + 1, 0); // last day of cycleEndMonth
  const daysLeft = Math.ceil((cycleEndDate - now) / 86400000);
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const cycleLabel = `${monthNames[cycleStart]}–${monthNames[cycleEndMonth]} ${year}`;
  return { cycleLabel, daysLeft, prize: "₹500 Sponsor Voucher (Demo Prize)" };
}
