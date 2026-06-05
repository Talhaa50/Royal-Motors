/* ============================================
   ROYAL MOTORS — Shared Data Layer
   All pages read/write through FleetDB.
   Data persists via localStorage.
   ============================================ */

const FleetDB = (() => {

  const KEYS = {
    vendors:        'fo_vendors',
    vehicles:       'fo_vehicles',
    drivers:        'fo_drivers',
    trips:          'fo_trips',
    payouts:        'fo_payouts',
    salaryPayments: 'fo_salary_payments',
    auditLog:       'fo_audit_log',
    settings:       'fo_settings',
    seeded:         'fo_seeded_v2',
    customers:      'fo_customers',
    advances:       'fo_driver_advances',
    bookings:       'fo_bookings',
    expenses:       'fo_expenses',
    fixedCosts:     'fo_fixed_costs',
  };

  /* ── Helpers ─────────────────────────────── */
  const load  = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const loadO = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
  const save  = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch (e) { showToast('Storage full — data could not be saved', 'error'); throw e; }
    if (window.FleetSync) window.FleetSync.queuePush(k);
  };
  const uid   = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const today = () => new Date().toISOString().split('T')[0];
  const fmt       = n => 'PKR ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0 });
  const escapeHtml = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ── Seed Data ───────────────────────────── */
  function seed() {
    const _sf = localStorage.getItem(KEYS.seeded);
    if (_sf === 'clean') return;
    if (_sf && load(KEYS.vehicles).length > 0) return;

    const vendors = [
      { id:'v1', name:'Ahmed Traders',  contact:'Ahmed Raza',   phone:'0300-1234567', commRate:15, status:'active',   color:'#2A9D8F' },
      { id:'v2', name:'ZK Rentals',     contact:'Zubair Khan',  phone:'0321-9876543', commRate:12, status:'active',   color:'#e9c46a' },
      { id:'v3', name:'Malik Fleet',    contact:'Malik Saeed',  phone:'0333-4567890', commRate:15, status:'active',   color:'#e76f51' },
      { id:'v4', name:'Fast Motors',    contact:'Faisal Ahmed', phone:'0312-3456789', commRate:18, status:'inactive', color:'#a78bfa' },
    ];

    const vehicles = [
      { id:'vh1', plate:'LEA-2234', model:'Toyota Corolla 2020', vendorId:'v1', driverId:'d1', status:'active'      },
      { id:'vh2', plate:'LEB-5519', model:'Honda Civic 2021',    vendorId:'v2', driverId:'d2', status:'active'      },
      { id:'vh3', plate:'RAB-882',  model:'Suzuki Alto 2019',    vendorId:'v3', driverId:'d3', status:'active'      },
      { id:'vh4', plate:'LEA-7741', model:'Toyota Vitz 2018',    vendorId:'v1', driverId:'d4', status:'active'      },
      { id:'vh5', plate:'LHR-3302', model:'Honda City 2022',     vendorId:'v4', driverId:'d5', status:'maintenance' },
      { id:'vh6', plate:'ISB-441',  model:'Toyota Yaris 2021',   vendorId:'v2', driverId:'d6', status:'active'      },
      { id:'vh7', plate:'MUL-228',  model:'Suzuki Cultus 2020',  vendorId:'v3', driverId:'',   status:'inactive'    },
      { id:'vh8', plate:'FSD-992',  model:'Toyota Aqua 2019',    vendorId:'v1', driverId:'',   status:'maintenance' },
    ];

    const drivers = [
      { id:'d1', name:'Sajid Mehmood', phone:'0311-1234567', cnic:'35201-1234567-1', salary:28000, vehicleId:'vh1', status:'active' },
      { id:'d2', name:'Tariq Hussain', phone:'0322-9876543', cnic:'35202-9876543-2', salary:25000, vehicleId:'vh2', status:'active' },
      { id:'d3', name:'Bilal Shah',    phone:'0333-4567890', cnic:'35203-4567890-3', salary:22000, vehicleId:'vh3', status:'active' },
      { id:'d4', name:'Usman Qureshi', phone:'0344-3456789', cnic:'35204-3456789-4', salary:22000, vehicleId:'vh4', status:'active' },
      { id:'d5', name:'Aamir Khan',    phone:'0355-2345678', cnic:'35205-2345678-5', salary:20000, vehicleId:'vh5', status:'active' },
      { id:'d6', name:'Raza Ali',      phone:'0366-1234567', cnic:'35206-1234567-6', salary:20000, vehicleId:'vh6', status:'active' },
      { id:'d7', name:'Nasir Abbas',   phone:'0377-9876543', cnic:'35207-9876543-7', salary:20000, vehicleId:'',    status:'active' },
      { id:'d8', name:'Shahid Nawaz',  phone:'0388-4567890', cnic:'35208-4567890-8', salary:18000, vehicleId:'',    status:'active' },
    ];

    // Generate 45 days of trips
    const trips = [];
    const vehicleDriverMap = {
      'vh1':{ vendorId:'v1', driverId:'d1' },
      'vh2':{ vendorId:'v2', driverId:'d2' },
      'vh3':{ vendorId:'v3', driverId:'d3' },
      'vh4':{ vendorId:'v1', driverId:'d4' },
      'vh5':{ vendorId:'v4', driverId:'d5' },
      'vh6':{ vendorId:'v2', driverId:'d6' },
    };
    const vhIds = Object.keys(vehicleDriverMap);
    let tripNum = 1;

    for (let dayOffset = 44; dayOffset >= 1; dayOffset--) {
      const d = new Date(); d.setDate(d.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];
      // 3–6 trips per day
      const tripCount = 3 + Math.floor(Math.random() * 4);
      for (let t = 0; t < tripCount; t++) {
        const vhId = vhIds[tripNum % vhIds.length];
        const { vendorId, driverId } = vehicleDriverMap[vhId];
        const gross = 800 + Math.round(Math.random() * 2200);
        const commPct = 12 + Math.round(Math.random() * 8);
        const commission = Math.round(gross * commPct / 100);
        const expAmt = Math.random() > 0.7 ? Math.round(Math.random() * 1200) : 0;
        const net = Math.max(0, gross - commission - expAmt);
        trips.push({
          id: 'TRP-' + String(tripNum).padStart(4, '0'),
          date: dateStr,
          vehicleId: vhId,
          vendorId,
          driverId,
          gross,
          commission,
          commPct,
          expenses: expAmt,
          net,
          status: Math.random() > 0.05 ? 'completed' : (Math.random() > 0.5 ? 'pending' : 'cancelled'),
          notes: '',
          createdAt: dateStr,
        });
        tripNum++;
      }
    }

    // Generate payouts
    const payouts = [
      { id:'PAY-0001', vendorId:'v1', amount:80000, method:'Bank Transfer', date:'2024-05-15', notes:'Monthly settlement', ref:'IBAN-AH-001' },
      { id:'PAY-0002', vendorId:'v2', amount:65000, method:'Bank Transfer', date:'2024-05-20', notes:'Monthly settlement', ref:'IBAN-ZK-001' },
      { id:'PAY-0003', vendorId:'v3', amount:55000, method:'Cash',          date:'2024-06-01', notes:'Partial payment',   ref:'CASH-MF-001' },
      { id:'PAY-0004', vendorId:'v1', amount:45000, method:'Bank Transfer', date:'2024-04-30', notes:'April settlement',  ref:'IBAN-AH-002' },
      { id:'PAY-0005', vendorId:'v4', amount:38000, method:'Cheque',        date:'2024-04-25', notes:'Q1 settlement',     ref:'CHQ-FM-001' },
      { id:'PAY-0006', vendorId:'v2', amount:42000, method:'Bank Transfer', date:'2024-04-18', notes:'April payment',     ref:'IBAN-ZK-002' },
    ];

    save(KEYS.vendors,  vendors);
    save(KEYS.vehicles, vehicles);
    save(KEYS.drivers,  drivers);
    save(KEYS.trips,    trips);
    save(KEYS.payouts,  payouts);
    save(KEYS.settings, { currency:'PKR', bizName:'Royal Motors', liabilityThreshold:100000 });
    localStorage.setItem(KEYS.seeded, '1');
  }

  /* ── Audit Log ───────────────────────────── */
  const getAuditLog = () => load(KEYS.auditLog);
  function addAuditEntry(action, entity, id, name, note) {
    const log = getAuditLog();
    log.unshift({
      id:          'AL-' + uid(),
      action,                   // 'delete' | 'restore'
      entity,                   // 'vendor' | 'vehicle' | 'driver'
      entityId:    id,
      entityName:  name,
      performedAt: new Date().toISOString(),
      performedBy: (window.fbAuth && window.fbAuth.currentUser ? window.fbAuth.currentUser.email : 'admin'),
      note:        note || '',
    });
    save(KEYS.auditLog, log.slice(0, 500));
  }

  /* ── Getters (active records only — excludes soft-deleted) ── */
  const getVendors        = () => load(KEYS.vendors).filter(v => !v._deleted);
  const getVehicles       = () => load(KEYS.vehicles).filter(v => !v._deleted);
  const getDrivers        = () => load(KEYS.drivers).filter(d => !d._deleted);
  const getTrips          = () => load(KEYS.trips);
  const getPayouts        = () => load(KEYS.payouts);
  const getSalaryPayments = () => load(KEYS.salaryPayments);
  const getSettings       = () => loadO(KEYS.settings);

  const getVendor  = id => load(KEYS.vendors).find(v => v.id === id);
  const getVehicle = id => load(KEYS.vehicles).find(v => v.id === id);
  const getDriver  = id => load(KEYS.drivers).find(d => d.id === id);

  /* ── Deleted record getters ──────────────── */
  const getDeletedVendors  = () => load(KEYS.vendors).filter(v => v._deleted);
  const getDeletedVehicles = () => load(KEYS.vehicles).filter(v => v._deleted);
  const getDeletedDrivers  = () => load(KEYS.drivers).filter(d => d._deleted);

  /* ── Computed: Vendor Balance ────────────── */
  function getVendorBalance(vendorId) {
    const trips   = getTrips().filter(t => t.vendorId === vendorId && t.status !== 'cancelled');
    const payouts = getPayouts().filter(p => p.vendorId === vendorId);
    const earned  = trips.reduce((s, t) => s + (t.net || 0), 0);
    const paid    = payouts.reduce((s, p) => s + (p.amount || 0), 0);
    return earned - paid;
  }

  function getVendorStats(vendorId) {
    const trips   = getTrips().filter(t => t.vendorId === vendorId && t.status !== 'cancelled');
    const payouts = getPayouts().filter(p => p.vendorId === vendorId);
    const earned  = trips.reduce((s, t) => s + (t.net || 0), 0);
    const paid    = payouts.reduce((s, p) => s + (p.amount || 0), 0);
    const vehicles = getVehicles().filter(v => v.vendorId === vendorId);
    const lastPayout = payouts.length ? payouts.sort((a,b) => b.date.localeCompare(a.date))[0].date : '—';
    return {
      balance: earned - paid,
      lifetime: earned,
      lifetimePaid: paid,
      vehicleCount: vehicles.length,
      tripCount: trips.length,
      lastPayout,
    };
  }

  /* ── Computed: Dashboard Stats ───────────── */
  function getDashboardStats(days = 30) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const recentTrips = getTrips().filter(t => t.date >= cutoffStr && t.status !== 'cancelled');

    const totalRevenue   = recentTrips.reduce((s, t) => s + (t.gross || 0), 0);
    const totalComm      = recentTrips.reduce((s, t) => s + (t.commission || 0), 0);
    const totalExpenses  = recentTrips.reduce((s, t) => s + (t.expenses || 0), 0);
    const netProfit      = totalComm - totalExpenses;
    const totalVendorNet = recentTrips.reduce((s, t) => s + (t.net || 0), 0);

    const vendors  = getVendors();
    const totalLiability = vendors.reduce((s, v) => s + Math.max(0, getVendorBalance(v.id)), 0);

    const vehicles    = getVehicles();
    const activeVeh   = vehicles.filter(v => v.status === 'active' || v.status === 'on_trip').length;

    const drivers = getDrivers();
    const driverUtil = drivers.map(d => {
      const dTrips = recentTrips.filter(t => t.driverId === d.id);
      const uniqueDays = new Set(dTrips.map(t => t.date)).size;
      return uniqueDays;
    });
    const avgUtil = driverUtil.length
      ? Math.round(driverUtil.reduce((a,b) => a + b, 0) / driverUtil.length / days * 100)
      : 0;

    return { totalRevenue, totalComm, netProfit, totalLiability, activeVeh, totalVeh:vehicles.length, avgUtil, tripCount:recentTrips.length };
  }

  /* Trips by date range for charts */
  function getTripsByDay(days = 30) {
    const result = {};
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days + 1);
    for (let i = 0; i < days; i++) {
      const d = new Date(cutoff); d.setDate(d.getDate() + i);
      result[d.toISOString().split('T')[0]] = { rev: 0, comm: 0, net: 0, exp: 0 };
    }
    getTrips().filter(t => t.date >= Object.keys(result)[0] && t.status !== 'cancelled')
      .forEach(t => {
        if (result[t.date]) {
          result[t.date].rev  += t.gross || 0;
          result[t.date].comm += t.commission || 0;
          result[t.date].net  += t.net || 0;
          result[t.date].exp  += t.expenses || 0;
        }
      });
    return result;
  }

  /* ── Add Trip ────────────────────────────── */
  function addTrip(tripData) {
    const trips = getTrips();
    const id = 'TRP-' + uid();
    const gross      = parseFloat(tripData.gross)      || 0;
    const commission = parseFloat(tripData.commission) || 0;
    const expenses   = parseFloat(tripData.expenses)   || 0;
    const net        = Math.max(0, gross - commission - expenses);
    const commPct    = gross > 0 ? Math.round(commission / gross * 100 * 10) / 10 : 0;
    const trip = {
      id,
      date:       tripData.date || today(),
      vehicleId:  tripData.vehicleId  || '',
      vendorId:   tripData.vendorId   || '',
      driverId:   tripData.driverId   || '',
      customerId: tripData.customerId || '',
      bookingId:  tripData.bookingId  || '',
      gross, commission, expenses, net, commPct,
      status:     tripData.status || 'completed',
      notes:      tripData.notes  || '',
      createdAt:  today(),
    };
    trips.unshift(trip);
    save(KEYS.trips, trips);
    return trip;
  }

  /* ── Update Trip ─────────────────────────── */
  function updateTrip(id, changes) {
    const trips = getTrips();
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const t = { ...trips[idx], ...changes };
    // Recalculate net
    t.net = Math.max(0, (t.gross||0) - (t.commission||0) - (t.expenses||0));
    trips[idx] = t;
    save(KEYS.trips, trips);
    return t;
  }

  /* ── Delete Trip ─────────────────────────── */
  function deleteTrip(id) {
    const trips = getTrips().filter(t => t.id !== id);
    save(KEYS.trips, trips);
  }

  /* ── Issue Payout ────────────────────────── */
  function addPayout(data) {
    const payouts = getPayouts();
    const id = 'PAY-' + uid();
    const payout = {
      id,
      vendorId: data.vendorId,
      amount:   parseFloat(data.amount) || 0,
      method:   data.method  || 'Bank Transfer',
      date:     data.date    || today(),
      notes:    data.notes   || '',
      ref:      data.ref     || id,
    };
    payouts.unshift(payout);
    save(KEYS.payouts, payouts);
    return payout;
  }

  /* ── Delete / Update Payout ─────────────── */
  function deletePayout(id) {
    save(KEYS.payouts, getPayouts().filter(p => p.id !== id));
  }
  function updatePayout(id, changes) {
    const payouts = getPayouts();
    const idx = payouts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    payouts[idx] = { ...payouts[idx], ...changes };
    save(KEYS.payouts, payouts);
    return payouts[idx];
  }

  /* ── Add / Update Vendor ─────────────────── */
  function addVendor(data) {
    const vendors = getVendors();
    const id = 'v' + uid();
    const vendor = { id, name:data.name||'', contact:data.contact||'', phone:data.phone||'', commRate:parseFloat(data.commRate)||15, status:'active', color:data.color||'#2A9D8F' };
    vendors.push(vendor);
    save(KEYS.vendors, vendors);
    return vendor;
  }
  function updateVendor(id, changes) {
    const vendors = getVendors();
    const idx = vendors.findIndex(v => v.id === id);
    if (idx === -1) return null;
    vendors[idx] = { ...vendors[idx], ...changes };
    save(KEYS.vendors, vendors);
    return vendors[idx];
  }

  /* ── Add Vehicle ─────────────────────────── */
  function addVehicle(data) {
    const vehicles = getVehicles();
    const id = 'vh' + uid();
    const v = { id, plate:data.plate||'', make:data.make||'', model:data.model||'', year:data.year||'', category:data.category||'', vendorId:data.vendorId||'', driverId:data.driverId||null, status:data.status||'active', commPct:parseFloat(data.commPct)||15, notes:data.notes||'' };
    vehicles.push(v);
    save(KEYS.vehicles, vehicles);
    return v;
  }
  function updateVehicle(id, changes) {
    const vehicles = getVehicles();
    const idx = vehicles.findIndex(v => v.id === id);
    if (idx === -1) return null;
    vehicles[idx] = { ...vehicles[idx], ...changes };
    save(KEYS.vehicles, vehicles);
    return vehicles[idx];
  }

  /* ── Add Driver ──────────────────────────── */
  function addDriver(data) {
    const drivers = getDrivers();
    const id = 'd' + uid();
    const d = { id, name:data.name||'', phone:data.phone||'', cnic:data.cnic||'', salary:parseFloat(data.salary)||0, vehicleId:data.vehicleId||'', status:'active' };
    drivers.push(d);
    save(KEYS.drivers, drivers);
    return d;
  }
  function updateDriver(id, changes) {
    const drivers = getDrivers();
    const idx = drivers.findIndex(d => d.id === id);
    if (idx === -1) return null;
    drivers[idx] = { ...drivers[idx], ...changes };
    save(KEYS.drivers, drivers);
    return drivers[idx];
  }

  function softDelete(key, id, entity) {
    const records = load(key);
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return;
    const rec = records[idx];
    records[idx] = { ...rec, _deleted: true, _deletedAt: new Date().toISOString(), _deletedBy: (window.fbAuth && window.fbAuth.currentUser ? window.fbAuth.currentUser.email : 'admin') };
    save(key, records);
    addAuditEntry('delete', entity, id, rec.name || rec.plate || id, '');
  }

  function restoreRecord(key, id, entity) {
    const records = load(key);
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return;
    const rec = records[idx];
    const { _deleted, _deletedAt, _deletedBy, ...clean } = rec;
    records[idx] = clean;
    save(key, records);
    addAuditEntry('restore', entity, id, rec.name || rec.plate || id, '');
  }

  const deleteVendor  = id => softDelete(KEYS.vendors,  id, 'vendor');
  const deleteVehicle = id => softDelete(KEYS.vehicles, id, 'vehicle');
  const deleteDriver  = id => softDelete(KEYS.drivers,  id, 'driver');

  const restoreVendor  = id => restoreRecord(KEYS.vendors,  id, 'vendor');
  const restoreVehicle = id => restoreRecord(KEYS.vehicles, id, 'vehicle');
  const restoreDriver  = id => restoreRecord(KEYS.drivers,  id, 'driver');

  /* ── Customer CRUD ───────────────────────── */
  const getCustomers        = () => load(KEYS.customers).filter(c => !c._deleted);
  const getCustomer         = id => load(KEYS.customers).find(c => c.id === id);
  const getDeletedCustomers = () => load(KEYS.customers).filter(c => c._deleted);

  function addCustomer(data) {
    const customers = load(KEYS.customers);
    const id = 'CUS-' + String(Date.now()).slice(-6);
    const c = {
      id,
      name:      data.name    || '',
      phone:     data.phone   || '',
      cnic:      data.cnic    || '',
      address:   data.address || '',
      route:     data.route   || '',
      notes:     data.notes   || '',
      status:    data.status  || 'active',
      createdAt: today(),
    };
    customers.unshift(c);
    save(KEYS.customers, customers);
    return c;
  }
  function updateCustomer(id, changes) {
    const customers = load(KEYS.customers);
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    customers[idx] = { ...customers[idx], ...changes };
    save(KEYS.customers, customers);
    return customers[idx];
  }
  const deleteCustomer = id => softDelete(KEYS.customers, id, 'customer');
  const getCustomerBookings = customerId => load(KEYS.trips).filter(t => t.customerId === customerId);

  const getCustomerByPhone = phone => {
    if (!phone) return null;
    const clean = phone.replace(/[\s\-()]/g, '');
    return load(KEYS.customers).find(c => !c._deleted && (c.phone || '').replace(/[\s\-()]/g, '') === clean);
  };

  /* ── Booking CRUD ────────────────────────── */
  const getBookings     = ()  => load(KEYS.bookings);
  const getBooking      = id  => load(KEYS.bookings).find(b => b.id === id);
  const getHoldBookings = ()  => load(KEYS.bookings).filter(b => b.status === 'hold');

  const getCustomerBookingHistory = customerId =>
    load(KEYS.bookings)
      .filter(b => b.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function addBooking(data) {
    const all = load(KEYS.bookings);
    const id  = 'BK-' + String(Date.now()).slice(-6);
    const b   = {
      id,
      customerId:    data.customerId    || '',
      customerName:  data.customerName  || '',
      customerPhone: data.customerPhone || '',
      serviceType:   data.serviceType   || 'pick_drop',
      fromLocation:  data.fromLocation  || '',
      toLocation:    data.toLocation    || '',
      tourFromDate:  data.tourFromDate  || '',
      tourToDate:    data.tourToDate    || '',
      requestedDate: data.requestedDate || today(),
      vehicleIds:    Array.isArray(data.vehicleIds) ? data.vehicleIds : [],
      driverIds:     Array.isArray(data.driverIds)  ? data.driverIds  : [],
      gross:         data.gross      ? parseFloat(data.gross)      : null,
      commission:    data.commission ? parseFloat(data.commission) : null,
      status:        data.status     || 'confirmed',
      notes:         data.notes      || '',
      createdAt:     today(),
    };
    all.unshift(b);
    save(KEYS.bookings, all);
    return b;
  }

  function updateBooking(id, changes) {
    const all = load(KEYS.bookings);
    const idx = all.findIndex(b => b.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...changes };
    save(KEYS.bookings, all);
    return all[idx];
  }

  const deleteBooking = id => save(KEYS.bookings, load(KEYS.bookings).filter(b => b.id !== id));

  /* ── Expenses (variable) ────────────────── */
  const EXP_CATS = {
    food:        '🍽 Food & Drinks',
    rent:        '🏢 Office Rent',
    utilities:   '💡 Electricity / Utilities',
    internet:    '🌐 Internet & Phone',
    supplies:    '📦 Office Supplies',
    transport:   '🚕 Travel / Transport',
    miscellaneous:'📌 Miscellaneous',
  };

  const getExpenses      = ()  => load(KEYS.expenses);
  const getExpense       = id  => load(KEYS.expenses).find(e => e.id === id);

  function addExpense(data) {
    const all = load(KEYS.expenses);
    const id  = 'EXP-' + String(Date.now()).slice(-6);
    const e   = {
      id,
      date:        data.date        || today(),
      category:    data.category    || 'miscellaneous',
      description: data.description || '',
      amount:      parseFloat(data.amount) || 0,
      notes:       data.notes       || '',
      createdAt:   today(),
    };
    all.unshift(e);
    save(KEYS.expenses, all);
    return e;
  }

  function updateExpense(id, changes) {
    const all = load(KEYS.expenses);
    const idx = all.findIndex(e => e.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...changes };
    save(KEYS.expenses, all);
    return all[idx];
  }

  const deleteExpense = id => save(KEYS.expenses, load(KEYS.expenses).filter(e => e.id !== id));

  /* ── Fixed Costs (monthly recurring) ────── */
  const getFixedCosts    = ()  => load(KEYS.fixedCosts);
  const getFixedCost     = id  => load(KEYS.fixedCosts).find(f => f.id === id);

  function addFixedCost(data) {
    const all = load(KEYS.fixedCosts);
    const id  = 'FXD-' + String(Date.now()).slice(-6);
    const f   = {
      id,
      name:      data.name     || '',
      category:  data.category || 'miscellaneous',
      amount:    parseFloat(data.amount) || 0,
      notes:     data.notes    || '',
      active:    true,
      createdAt: today(),
    };
    all.unshift(f);
    save(KEYS.fixedCosts, all);
    return f;
  }

  function updateFixedCost(id, changes) {
    const all = load(KEYS.fixedCosts);
    const idx = all.findIndex(f => f.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...changes };
    save(KEYS.fixedCosts, all);
    return all[idx];
  }

  const deleteFixedCost = id => save(KEYS.fixedCosts, load(KEYS.fixedCosts).filter(f => f.id !== id));

  /* ── Driver Advances ─────────────────────── */
  const getAdvances = () => load(KEYS.advances);

  function addAdvance(data) {
    const advances = getAdvances();
    const id = 'ADV-' + uid();
    const a = {
      id,
      driverId:  data.driverId || '',
      amount:    parseFloat(data.amount) || 0,
      date:      data.date   || today(),
      reason:    data.reason || '',
      status:    'pending',
      createdAt: today(),
    };
    advances.unshift(a);
    save(KEYS.advances, advances);
    return a;
  }
  function settleAdvance(id) {
    const advances = getAdvances();
    const idx = advances.findIndex(a => a.id === id);
    if (idx === -1) return;
    advances[idx] = { ...advances[idx], status: 'settled', settledDate: today() };
    save(KEYS.advances, advances);
  }
  function deleteAdvance(id) {
    save(KEYS.advances, getAdvances().filter(a => a.id !== id));
  }
  function getDriverAdvanceSummary(driverId) {
    const advances = getAdvances().filter(a => a.driverId === driverId);
    const pending  = advances.filter(a => a.status === 'pending').reduce((s, a) => s + (a.amount || 0), 0);
    return { pending, total: advances.reduce((s, a) => s + (a.amount || 0), 0), count: advances.length };
  }

  /* ── Trip Receipt HTML Builder ─────────── */
  function buildTripReceiptHTML(tripId) {
    const t  = load(KEYS.trips).find(x => x.id === tripId);
    if (!t) return '';
    const vh = load(KEYS.vehicles).find(x => x.id === t.vehicleId);
    const dr = load(KEYS.drivers).find(x => x.id === t.driverId);
    const vn = load(KEYS.vendors).find(x => x.id === t.vendorId);
    const bk = t.bookingId ? load(KEYS.bookings).find(x => x.id === t.bookingId) : null;
    const s  = loadO(KEYS.settings);

    const dateFormatted = t.date
      ? new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { day:'numeric', month:'long', year:'numeric' })
      : '—';
    const statusColor = t.status === 'completed' ? '#059669' : t.status === 'pending' ? '#d4a017' : '#e76f51';
    const commPct     = t.commPct ? ' (' + t.commPct + '%)' : '';
    const generatedAt = new Date().toLocaleString('en-US', { dateStyle:'medium', timeStyle:'short' });

    // Route from linked booking or notes fallback
    let routeSection = '';
    if (bk && bk.serviceType === 'pick_drop' && (bk.fromLocation || bk.toLocation)) {
      routeSection = '<div class="section">'
        + '<div class="section-label">Route</div>'
        + '<div style="display:flex;align-items:center;gap:12px;">'
        + '<span style="font-size:22px;flex-shrink:0;">🚗</span>'
        + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
        + '<span style="font-size:14px;font-weight:700;color:#111;">' + escapeHtml(bk.fromLocation || '?') + '</span>'
        + '<span style="font-size:16px;color:#2A9D8F;font-weight:700;">→</span>'
        + '<span style="font-size:14px;font-weight:700;color:#111;">' + escapeHtml(bk.toLocation || '?') + '</span>'
        + '</div></div></div>';
    } else if (bk && bk.serviceType === 'tour' && (bk.tourFromDate || bk.tourToDate)) {
      routeSection = '<div class="section">'
        + '<div class="section-label">Tour Dates</div>'
        + '<div style="display:flex;align-items:center;gap:12px;">'
        + '<span style="font-size:22px;flex-shrink:0;">🗺</span>'
        + '<div style="display:flex;align-items:center;gap:8px;">'
        + '<span style="font-size:14px;font-weight:700;color:#111;">' + escapeHtml(bk.tourFromDate || '?') + '</span>'
        + '<span style="font-size:16px;color:#2A9D8F;font-weight:700;">→</span>'
        + '<span style="font-size:14px;font-weight:700;color:#111;">' + escapeHtml(bk.tourToDate || '?') + '</span>'
        + '</div></div></div>';
    } else if (t.notes) {
      routeSection = '<div class="section">'
        + '<div class="section-label">Route / Notes</div>'
        + '<div style="font-size:13px;color:#444;">' + escapeHtml(t.notes) + '</div>'
        + '</div>';
    }

    // Vehicle display — combine make/model/year if available
    const vehMakeModel = vh ? ([vh.make, vh.model].filter(Boolean).join(' ') || vh.plate) : '—';
    const vehYear      = vh && vh.year ? String(vh.year) : '';
    const vehComm      = vh && vh.commPct ? vh.commPct + '% commission' : '';

    const row = (label, value, color, borderBottom) =>
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:11px 20px;'
      + (borderBottom !== false ? 'border-bottom:1px solid #eee;' : '')
      + '">'
      + '<span style="font-size:13px;color:#555;">' + label + '</span>'
      + '<span style="font-size:13px;font-weight:700;font-family:monospace;color:' + (color||'#111') + ';">' + value + '</span>'
      + '</div>';

    return '<!DOCTYPE html><html><head><meta charset="UTF-8">'
      + '<title>Receipt ' + t.id + '</title>'
      + '<style>'
      + '*{box-sizing:border-box;margin:0;padding:0;}'
      + 'body{font-family:Arial,sans-serif;background:#f4f6f8;display:flex;justify-content:center;padding:40px 16px;}'
      + '.card{background:white;border-radius:12px;width:100%;max-width:420px;box-shadow:0 4px 24px rgba(0,0,0,.12);overflow:hidden;}'
      + '.header{background:linear-gradient(135deg,#264653,#2A9D8F);padding:24px 24px 20px;color:white;}'
      + '.logo-row{display:flex;align-items:center;gap:10px;margin-bottom:16px;}'
      + '.logo-box{width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;}'
      + '.co-name{font-size:14px;font-weight:700;}'
      + '.co-sub{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.5px;}'
      + '.trip-id{font-size:26px;font-weight:700;font-family:monospace;letter-spacing:1px;}'
      + '.trip-date{font-size:12px;opacity:.8;margin-top:3px;}'
      + '.status-badge{display:inline-block;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:10px;}'
      + '.section{padding:16px 20px;border-bottom:1px solid #f0f0f0;}'
      + '.section-label{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;font-weight:600;}'
      + '.vehicle-row{display:flex;align-items:center;gap:14px;}'
      + '.vehicle-icon{width:44px;height:44px;background:#e8f5f3;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}'
      + '.plate{font-size:18px;font-weight:700;font-family:monospace;color:#111;}'
      + '.model{font-size:12px;color:#888;margin-top:2px;}'
      + '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}'
      + '.info-box{background:#f8f9fa;border-radius:8px;padding:11px 14px;}'
      + '.info-box-label{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;}'
      + '.info-box-value{font-size:13px;font-weight:700;color:#111;}'
      + '.breakdown{border-top:1px solid #eee;}'
      + '.net-row{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:#e8f5f3;}'
      + '.net-label{font-size:14px;font-weight:700;color:#2A9D8F;}'
      + '.net-value{font-size:22px;font-weight:700;font-family:monospace;color:#2A9D8F;}'
      + '.notes-box{padding:12px 20px;background:#fffbeb;border-top:1px solid #fef3c7;}'
      + '.footer-bar{padding:14px 20px;background:#f8f9fa;border-top:1px solid #eee;text-align:center;font-size:10px;color:#aaa;}'
      + '.print-btn{display:block;width:100%;padding:13px;background:#2A9D8F;color:white;border:none;border-radius:0;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:.3px;}'
      + '.print-btn:hover{background:#238a7d;}'
      + '@media print{body{background:white;padding:0;}.card{box-shadow:none;border-radius:0;max-width:100%;}.print-btn{display:none;}@page{margin:8mm;}}'
      + '</style></head><body>'
      + '<div class="card">'
      + '<div class="header">'
      + '<div class="logo-row"><div class="logo-box">F</div><div><div class="co-name">' + (s.companyName || s.bizName || 'Royal Motors') + '</div><div class="co-sub">Duty Receipt</div></div></div>'
      + '<div class="trip-id">' + t.id + '</div>'
      + '<div class="trip-date">' + dateFormatted + '</div>'
      + '<div class="status-badge">' + (t.status || 'completed').toUpperCase() + '</div>'
      + '</div>'
      + routeSection
      + '<div class="section"><div class="section-label">Vehicle</div>'
      + '<div class="vehicle-row"><div class="vehicle-icon">&#x1F697;</div><div style="flex:1;">'
      + '<div class="plate">' + escapeHtml(vh ? vh.plate : '—') + '</div>'
      + '<div class="model">' + escapeHtml(vehMakeModel) + (vehYear ? ' · ' + vehYear : '') + '</div>'
      + (vehComm ? '<div style="font-size:10px;color:#999;margin-top:2px;">' + escapeHtml(vehComm) + '</div>' : '')
      + '</div></div></div>'
      + '<div class="section"><div class="section-label">Duty Details</div>'
      + '<div class="info-grid">'
      + '<div class="info-box"><div class="info-box-label">Driver</div><div class="info-box-value">' + escapeHtml(dr ? dr.name : '—') + '</div></div>'
      + '<div class="info-box"><div class="info-box-label">Vendor</div><div class="info-box-value">' + escapeHtml(vn ? vn.name : '—') + '</div></div>'
      + '<div class="info-box"><div class="info-box-label">Duty Date</div><div class="info-box-value" style="font-size:12px;">' + (t.date || '—') + '</div></div>'
      + '<div class="info-box"><div class="info-box-label">Status</div><div class="info-box-value" style="color:' + statusColor + ';">' + escapeHtml((t.status||'').toUpperCase()) + '</div></div>'
      + '</div></div>'
      + '<div class="breakdown">'
      + row('Gross Revenue', 'PKR ' + (t.gross||0).toLocaleString(), '#111', true)
      + row('Commission' + commPct, '− PKR ' + (t.commission||0).toLocaleString(), '#e76f51', true)
      + (t.expenses > 0 ? row('Expenses', '− PKR ' + t.expenses.toLocaleString(), '#e76f51', true) : '')
      + '</div>'
      + '<div class="net-row"><span class="net-label">Vendor Net</span><span class="net-value">PKR ' + (t.net||0).toLocaleString() + '</span></div>'
      + (t.notes && !routeSection.includes(escapeHtml(t.notes).slice(0,20)) ? '<div class="notes-box"><div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">Notes</div><div style="font-size:13px;color:#555;">' + escapeHtml(t.notes) + '</div></div>' : '')
      + '<div class="footer-bar">Generated by Royal Motors &middot; ' + generatedAt + '</div>'
      + '<button class="print-btn" onclick="window.print()">&#x1F5A8; Print / Save as PDF</button>'
      + '</div>'
      + '</body></html>';
  }

  /* ── Vendor Statement HTML Builder ─────── */
  function buildVendorStatementHTML(opts) {
    const { vendorId, periodLabel, filterFn } = opts;
    const v        = load(KEYS.vendors).find(x => x.id === vendorId);
    if (!v) return '';
    const allTrips   = load(KEYS.trips).filter(t => t.vendorId === vendorId && t.status !== 'cancelled' && filterFn(t)).sort((a, b) => b.date.localeCompare(a.date));
    const allPayouts = load(KEYS.payouts).filter(p => p.vendorId === vendorId && filterFn(p)).sort((a, b) => b.date.localeCompare(a.date));
    const vehicles   = load(KEYS.vehicles).filter(vh => vh.vendorId === vendorId && !vh._deleted);
    const printDate  = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

    const totalRev  = allTrips.reduce((s, t) => s + (t.gross || 0), 0);
    const totalComm = allTrips.reduce((s, t) => s + (t.commission || 0), 0);
    const totalExp  = allTrips.reduce((s, t) => s + (t.expenses || 0), 0);
    const totalNet  = allTrips.reduce((s, t) => s + (t.net || 0), 0);
    const totalPaid = allPayouts.reduce((s, p) => s + (p.amount || 0), 0);
    const balance   = totalNet - totalPaid;
    const balColor  = balance > 0 ? '#c00' : '#059669';

    const tripsRows = allTrips.slice(0, 200).map(t => {
      const vh = load(KEYS.vehicles).find(x => x.id === t.vehicleId);
      return '<tr><td>' + escapeHtml(t.id) + '</td><td>' + escapeHtml(t.date) + '</td><td>' + escapeHtml(vh ? vh.plate : '—') + '</td>'
        + '<td style="text-align:right;">PKR ' + (t.gross||0).toLocaleString() + '</td>'
        + '<td style="text-align:right;">PKR ' + (t.commission||0).toLocaleString() + '</td>'
        + '<td style="text-align:right;">' + (t.expenses ? 'PKR '+t.expenses.toLocaleString() : '—') + '</td>'
        + '<td style="text-align:right;font-weight:600;">PKR ' + (t.net||0).toLocaleString() + '</td></tr>';
    }).join('');

    const payoutRows = allPayouts.map(p =>
      '<tr><td>' + escapeHtml(p.date) + '</td><td>' + escapeHtml(p.method) + '</td>'
      + '<td style="text-align:right;font-weight:600;">PKR ' + (p.amount||0).toLocaleString() + '</td>'
      + '<td>' + escapeHtml(p.notes || '—') + '</td></tr>'
    ).join('');

    const footerRow = allTrips.length
      ? '<tfoot><tr style="font-weight:700;background:#f8f8f8;border-top:1px solid #ccc;">'
        + '<td colspan="3">Total (' + allTrips.length + ' trips)</td>'
        + '<td style="text-align:right;">PKR ' + totalRev.toLocaleString() + '</td>'
        + '<td style="text-align:right;">PKR ' + totalComm.toLocaleString() + '</td>'
        + '<td style="text-align:right;">PKR ' + totalExp.toLocaleString() + '</td>'
        + '<td style="text-align:right;">PKR ' + totalNet.toLocaleString() + '</td>'
        + '</tr></tfoot>'
      : '';

    const css = [
      '*{box-sizing:border-box;margin:0;padding:0;}',
      'body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:28px 32px;}',
      'h1{font-size:20px;margin-bottom:2px;}',
      '.sub{color:#666;font-size:11px;margin-bottom:4px;}',
      '.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a3840;padding-bottom:12px;margin-bottom:16px;}',
      '.pbadge{display:inline-block;background:#e8f5f3;color:#1a3840;border:1px solid #2A9D8F;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:700;margin-top:6px;}',
      '.mg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;}',
      '.mb{border:1px solid #ddd;border-radius:4px;padding:10px;text-align:center;}',
      '.ml{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;}',
      '.mv{font-size:14px;font-weight:700;}',
      'h2{font-size:12px;font-weight:700;border-bottom:1px solid #ddd;padding-bottom:4px;margin:14px 0 8px;color:#264653;}',
      'table{width:100%;border-collapse:collapse;font-size:11px;}',
      'th{background:#f0f7f6;padding:5px 8px;text-align:left;font-size:9px;text-transform:uppercase;color:#264653;}',
      'td{padding:5px 8px;border-bottom:1px solid #eee;}',
      '.bb{background:#fef9ec;border:1px solid #e9c46a;border-radius:4px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-top:16px;}',
      '.bv{font-size:18px;font-weight:700;color:' + balColor + ';}',
      '.ft{margin-top:20px;text-align:center;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:10px;}',
      '@media print{body{padding:12px;}@page{margin:10mm;}}',
    ].join('');

    return '<!DOCTYPE html><html><head><meta charset="UTF-8">'
      + '<title>' + periodLabel + ' — ' + (v.name||'') + '</title>'
      + '<style>' + css + '</style>'
      + '</head><body>'
      + '<div class="hdr"><div>'
      + '<h1>' + escapeHtml(v.name||'') + '</h1>'
      + '<div class="sub">Contact: ' + escapeHtml(v.contact||'—') + ' &nbsp;·&nbsp; ' + escapeHtml(v.phone||'—') + ' &nbsp;·&nbsp; Commission: ' + v.commRate + '%</div>'
      + '<div class="sub">Vehicles: ' + escapeHtml(vehicles.map(vh => vh.plate).join(', ') || 'None') + '</div>'
      + '<div class="pbadge">' + periodLabel + '</div>'
      + '</div><div style="text-align:right;">'
      + '<div style="font-size:10px;color:#888;">Statement Date</div>'
      + '<div style="font-size:13px;font-weight:700;">' + printDate + '</div>'
      + '<div style="font-size:10px;color:#aaa;margin-top:2px;">Royal Motors</div>'
      + '</div></div>'
      + '<div class="mg">'
      + '<div class="mb"><div class="ml">Trips</div><div class="mv">' + allTrips.length + '</div></div>'
      + '<div class="mb"><div class="ml">Gross Revenue</div><div class="mv">PKR ' + totalRev.toLocaleString() + '</div></div>'
      + '<div class="mb"><div class="ml">Vendor Earned</div><div class="mv">PKR ' + totalNet.toLocaleString() + '</div></div>'
      + '<div class="mb"><div class="ml">Paid Out</div><div class="mv" style="color:#059669;">PKR ' + totalPaid.toLocaleString() + '</div></div>'
      + '</div>'
      + '<h2>Trip Records' + (allTrips.length > 200 ? ' (first 200)' : '') + '</h2>'
      + '<table><thead><tr><th>Trip ID</th><th>Date</th><th>Vehicle</th>'
      + '<th style="text-align:right;">Revenue</th><th style="text-align:right;">Commission</th>'
      + '<th style="text-align:right;">Expenses</th><th style="text-align:right;">Vendor Net</th></tr></thead>'
      + '<tbody>' + (tripsRows || '<tr><td colspan="7" style="text-align:center;padding:12px;color:#888;">No trips in this period</td></tr>') + '</tbody>'
      + footerRow + '</table>'
      + '<h2>Payout History (' + periodLabel + ')</h2>'
      + '<table><thead><tr><th>Date</th><th>Method</th><th style="text-align:right;">Amount</th><th>Notes</th></tr></thead>'
      + '<tbody>' + (payoutRows || '<tr><td colspan="4" style="text-align:center;padding:12px;color:#888;">No payouts in this period</td></tr>') + '</tbody></table>'
      + '<div class="bb"><span style="font-size:13px;font-weight:600;color:#264653;">Balance Due (' + periodLabel + ')</span>'
      + '<span class="bv">PKR ' + Math.abs(balance).toLocaleString() + (balance <= 0 ? ' Settled' : '') + '</span></div>'
      + '<div class="ft">Generated by Royal Motors &middot; ' + printDate + ' &middot; ' + periodLabel + ' Statement for ' + (v.name||'') + '</div>'
      + '</body></html>';
  }

  /* ── Payout Receipt HTML Builder ────────── */
  function buildPayoutReceiptHTML(payoutId) {
    const p  = load(KEYS.payouts).find(x => x.id === payoutId);
    if (!p) return '';
    const v  = load(KEYS.vendors).find(x => x.id === p.vendorId);
    const s  = loadO(KEYS.settings);
    const dateFormatted = p.date ? new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { day:'numeric', month:'long', year:'numeric' }) : '—';
    const generatedAt = new Date().toLocaleString('en-US', { dateStyle:'medium', timeStyle:'short' });
    const coName = s.companyName || s.bizName || 'Royal Motors';
    const vendorLetter = v ? v.name[0].toUpperCase() : '?';
    const vendorColor  = v ? v.color : '#2A9D8F';

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payout Slip ' + p.id + '</title>'
      + '<style>'
      + '*{box-sizing:border-box;margin:0;padding:0;}'
      + 'body{font-family:Arial,sans-serif;background:#f4f6f8;display:flex;justify-content:center;padding:40px 16px;}'
      + '.card{background:white;border-radius:12px;width:100%;max-width:420px;box-shadow:0 4px 24px rgba(0,0,0,.12);overflow:hidden;}'
      + '.header{background:linear-gradient(135deg,#264653,#2A9D8F);padding:24px 24px 20px;color:white;}'
      + '.logo-row{display:flex;align-items:center;gap:10px;margin-bottom:16px;}'
      + '.logo-box{width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;}'
      + '.co-name{font-size:14px;font-weight:700;}'
      + '.co-sub{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.5px;}'
      + '.pay-id{font-size:26px;font-weight:700;font-family:monospace;letter-spacing:1px;}'
      + '.pay-date{font-size:12px;opacity:.8;margin-top:3px;}'
      + '.method-badge{display:inline-block;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:10px;}'
      + '.section{padding:16px 20px;border-bottom:1px solid #f0f0f0;}'
      + '.section-label{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;font-weight:600;}'
      + '.vendor-row{display:flex;align-items:center;gap:14px;}'
      + '.vendor-icon{width:44px;height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;flex-shrink:0;}'
      + '.vendor-name{font-size:18px;font-weight:700;color:#111;}'
      + '.vendor-sub{font-size:12px;color:#888;margin-top:2px;}'
      + '.amount-row{display:flex;justify-content:space-between;align-items:center;padding:20px;background:#e8f5f3;}'
      + '.amount-label{font-size:14px;font-weight:700;color:#2A9D8F;}'
      + '.amount-value{font-size:28px;font-weight:700;font-family:monospace;color:#2A9D8F;}'
      + '.detail-row{display:flex;justify-content:space-between;align-items:center;padding:11px 20px;border-bottom:1px solid #eee;font-size:13px;}'
      + '.detail-label{color:#555;}'
      + '.detail-value{font-weight:700;font-family:monospace;color:#111;}'
      + '.footer{padding:14px 20px;background:#f8f9fa;border-top:1px solid #eee;text-align:center;font-size:10px;color:#aaa;}'
      + '.print-btn{display:block;width:100%;padding:13px;background:#2A9D8F;color:white;border:none;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:.3px;}'
      + '.print-btn:hover{background:#238a7d;}'
      + '@media print{body{background:white;padding:0;}.card{box-shadow:none;border-radius:0;max-width:100%;}.print-btn{display:none;}@page{margin:8mm;}}'
      + '</style></head><body>'
      + '<div class="card">'
      + '<div class="header">'
      + '<div class="logo-row"><div class="logo-box">F</div><div><div class="co-name">' + coName + '</div><div class="co-sub">Payout Receipt</div></div></div>'
      + '<div class="pay-id">' + p.id + '</div>'
      + '<div class="pay-date">' + dateFormatted + '</div>'
      + '<div class="method-badge">' + (p.method || 'Payment').toUpperCase() + '</div>'
      + '</div>'
      + '<div class="section"><div class="section-label">Paid To</div>'
      + '<div class="vendor-row">'
      + '<div class="vendor-icon" style="background:' + vendorColor + '22;color:' + vendorColor + ';">' + vendorLetter + '</div>'
      + '<div><div class="vendor-name">' + escapeHtml(v ? v.name : '—') + '</div>'
      + '<div class="vendor-sub">' + escapeHtml(v ? (v.contact || '') : '') + (v && v.phone ? ' · ' + escapeHtml(v.phone) : '') + '</div></div>'
      + '</div></div>'
      + '<div class="amount-row"><span class="amount-label">Amount Paid</span><span class="amount-value">PKR ' + (p.amount || 0).toLocaleString() + '</span></div>'
      + '<div class="detail-row"><span class="detail-label">Payment Method</span><span class="detail-value">' + (p.method || '—') + '</span></div>'
      + '<div class="detail-row"><span class="detail-label">Reference / ID</span><span class="detail-value">' + (p.ref || p.id) + '</span></div>'
      + (p.notes ? '<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">' + escapeHtml(p.notes) + '</span></div>' : '')
      + '<div class="footer">Generated by Royal Motors &middot; ' + generatedAt + '</div>'
      + '<button class="print-btn" onclick="window.print()">&#x1F5A8; Print / Save as PDF</button>'
      + '</div>'
      + '</body></html>';
  }

  /* ── Backup / Restore ───────────────────── */
  function exportBackup() {
    const backup = {};
    Object.entries(KEYS).forEach(([key, storageKey]) => {
      const raw = localStorage.getItem(storageKey);
      if (raw) backup[storageKey] = JSON.parse(raw);
    });
    // also include salary payments
    const sal = localStorage.getItem(KEYS.salaryPayments);
    if (sal) backup[KEYS.salaryPayments] = JSON.parse(sal);
    // include theme
    backup['fo_theme'] = localStorage.getItem('fo_theme') || 'dark';
    return JSON.stringify(backup, null, 2);
  }

  function importBackup(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (typeof data !== 'object' || data === null || Array.isArray(data))
      throw new Error('Invalid backup: root must be an object');

    const ALLOWED = new Set([
      ...Object.values(KEYS), 'fo_salary_payments', 'fo_theme', 'fo_seeded_v2',
    ]);
    const ARRAY_KEYS = new Set([
      KEYS.vendors, KEYS.vehicles, KEYS.drivers, KEYS.trips, KEYS.payouts,
      KEYS.salaryPayments, KEYS.auditLog, KEYS.customers, KEYS.advances,
      KEYS.bookings, KEYS.expenses, KEYS.fixedCosts,
    ]);

    Object.entries(data).forEach(([k, v]) => {
      if (!ALLOWED.has(k)) return; // silently skip unknown keys
      if (ARRAY_KEYS.has(k) && !Array.isArray(v))
        throw new Error(`Invalid backup: "${k}" must be an array`);
      if (k === KEYS.settings && (typeof v !== 'object' || Array.isArray(v) || v === null))
        throw new Error('Invalid backup: settings must be an object');
      localStorage.setItem(k, JSON.stringify(v));
    });
  }

  /* ── Driver Salary Payments ─────────────── */
  function addSalaryPayment(data) {
    const payments = getSalaryPayments();
    const id = 'SAL-' + uid();
    const payment = {
      id,
      driverId:  data.driverId  || '',
      month:     data.month     || today().slice(0, 7),
      amount:    parseFloat(data.amount) || 0,
      paidDate:  data.paidDate  || today(),
      method:    data.method    || 'Cash',
      notes:     data.notes     || '',
      createdAt: today(),
    };
    payments.unshift(payment);
    save(KEYS.salaryPayments, payments);
    return payment;
  }

  function deleteSalaryPayment(id) {
    save(KEYS.salaryPayments, getSalaryPayments().filter(p => p.id !== id));
  }

  // Returns { paid: bool, payment: obj|null } for a driver in a given YYYY-MM month
  function getDriverSalaryStatus(driverId, month) {
    const payment = getSalaryPayments().find(p => p.driverId === driverId && p.month === month);
    return { paid: !!payment, payment: payment || null };
  }

  // Returns array of { driver, status } for the given month — used by dashboard alert
  function getUnpaidSalariesForMonth(month) {
    const drivers = getDrivers().filter(d => d.status === 'active');
    return drivers.filter(d => !getSalaryPayments().find(p => p.driverId === d.id && p.month === month));
  }

  /* ── Settings helpers ───────────────────── */
  function updateSettings(changes) {
    const s = loadO(KEYS.settings);
    Object.assign(s, changes);
    save(KEYS.settings, s);
  }

  /* ── Bulk-clear helpers (used by Settings page) ── */
  function clearTrips()   { save(KEYS.trips,   []); }
  function clearPayouts() { save(KEYS.payouts, []); }

  /* ── Reset (dev) ─────────────────────────── */
  function reset() {
    Object.keys(localStorage).filter(k => k.startsWith('fo_')).forEach(k => localStorage.removeItem(k));
    seed();
    location.reload();
  }

  /* ── Clean Slate (new client) ────────────── */
  async function cleanSlate() {
    const keep = [KEYS.settings, 'fo_theme'];
    Object.keys(localStorage)
      .filter(k => k.startsWith('fo_') && !keep.includes(k))
      .forEach(k => localStorage.removeItem(k));
    // Set seeded flag so seed() does NOT reload demo data on next page load
    localStorage.setItem(KEYS.seeded, 'clean');
    // Wipe Firestore for the current user so cloud data doesn't pull back
    if (window.fbDB && window.FleetSync && window.FleetSync.uid) {
      try {
        const uid  = window.FleetSync.uid;
        const col  = window.fbDB.collection('users').doc(uid).collection('store');
        const snap = await col.get();
        const batch = window.fbDB.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch(e) { console.warn('[CleanSlate] Firestore wipe failed:', e); }
    }
    sessionStorage.removeItem('fo_pulled');
    location.reload();
  }

  /* ── Theme ───────────────────────────────── */
  const THEME_KEY = 'fo_theme';
  function getTheme() { return localStorage.getItem(THEME_KEY) || 'dark'; }
  function setTheme(t) {
    localStorage.setItem(THEME_KEY, t);
    document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('.toggle-pill').forEach(el => el.classList.toggle('on', t === 'light'));
  }
  function toggleTheme() { setTheme(getTheme() === 'dark' ? 'light' : 'dark'); }

  /* ── Format helpers ──────────────────────── */
  const fmtMoney = n => 'PKR ' + Number(n || 0).toLocaleString('en-US');
  const fmtK     = n => { const v = Number(n || 0); return v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toString(); };

  /* ── Sidebar/Topbar injection ────────────── */
  function renderShell(activePage) {
    // Topbar
    const topbar = document.getElementById('topbar');
    if (topbar) {
      topbar.innerHTML = `
        <button class="hamburger-btn" id="hamburgerBtn" aria-label="Open menu" onclick="FleetDB.toggleSidebar()">☰</button>
        <div class="topbar-brand">
          <div class="logo-icon">F</div>
          <span class="brand-name">Royal Motors</span>
        </div>
        <div class="topbar-right">
          <div class="topbar-date">📅 <span id="dateLabel"></span></div>
          <a href="dispatch.html" class="quick-add-btn hide-mobile">+ New Entry</a>
          <span id="topbarUserEmail" style="font-size:11px;color:var(--text-muted);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:none;" title="Signed in as"></span>
          <div class="avatar" id="topbarAvatar" title="Signed in user">OP</div>
        </div>`;
      const dl = document.getElementById('dateLabel');
      if (dl) dl.textContent = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    }

    // Sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      const nav = (href, icon, label) => {
        const active = activePage === href ? 'active' : '';
        return `<a class="nav-item ${active}" href="${href}"><span class="nav-icon">${icon}</span><span>${label}</span></a>`;
      };
      sidebar.innerHTML = `
        <div class="sidebar-nav">
          <div class="sidebar-section">
            <div class="sidebar-label">Main</div>
            ${nav('index.html','⬡','Dashboard')}
          </div>
          <div class="sidebar-section">
            <div class="sidebar-label">Operations</div>
            ${nav('dispatch.html','⊕','Booking')}
            ${nav('trips.html','◎','Records')}
            ${nav('vehicles.html','▣','Vehicles')}
            ${nav('drivers.html','◈','Drivers')}
            ${nav('customers.html','👤','Customers')}
          </div>
          <div class="sidebar-section">
            <div class="sidebar-label">Finance</div>
            ${nav('vendors.html','◆','Vendors')}
            ${nav('ledger.html','≡','Vendor Ledger')}
            ${nav('payouts.html','⇄','Payouts')}
            ${nav('salary.html','₨','Driver Salary')}
            ${nav('expenses.html','⊟','Expenses')}
            ${nav('reports.html','◑','Reports')}
          </div>
          <div class="sidebar-section">
            <div class="sidebar-label">Admin</div>
            ${nav('settings.html','⚙','Settings')}
          </div>
        </div>
        <div class="sidebar-bottom">
          <div class="sidebar-user">
            <div class="avatar" id="sidebarAvatar" style="width:32px;height:32px;font-size:12px;">OP</div>
            <div class="sidebar-user-info" style="min-width:0;">
              <div class="sidebar-user-name" id="sidebarUserName">Operator</div>
              <div class="sidebar-user-role" id="sidebarUserEmail" style="font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px;">Admin</div>
            </div>
          </div>
          <button class="theme-toggle" onclick="FleetDB.toggleTheme()" aria-label="Toggle light/dark theme" style="margin-top:8px;background:none;border:none;cursor:pointer;width:100%;text-align:left;">
            <div class="toggle-pill" id="themePill"></div>
            <span>Light mode</span>
          </button>
          <button class="theme-toggle" onclick="FleetDB.logout()" aria-label="Sign out" style="margin-top:4px;color:rgba(231,111,81,.8);background:none;border:none;cursor:pointer;width:100%;text-align:left;">
            <span style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">⇥</span>
            <span>Sign Out</span>
          </button>
        </div>`;
    }

    // Overlay
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) { overlay.onclick = () => FleetDB.closeSidebar(); }

    // Mobile nav
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
      const ml = (href, icon, label) => {
        const active = activePage === href ? 'active' : '';
        return `<a href="${href}" class="${active}"><span>${icon}</span><span>${label}</span></a>`;
      };
      mobileNav.innerHTML = `
        ${ml('index.html','⬡','Home')}
        ${ml('dispatch.html','⊕','Booking')}
        ${ml('customers.html','👤','Customers')}
        ${ml('trips.html','◎','Duties')}
        ${ml('reports.html','◑','Reports')}`;
    }

    setTheme(getTheme());
  }

  function toggleSidebar() {
    const s = document.getElementById('sidebar');
    const o = document.getElementById('sidebarOverlay');
    if (s) s.classList.toggle('open');
    if (o) o.style.display = s && s.classList.contains('open') ? 'block' : 'none';
  }
  function closeSidebar() {
    const s = document.getElementById('sidebar');
    const o = document.getElementById('sidebarOverlay');
    if (s) s.classList.remove('open');
    if (o) o.style.display = 'none';
  }

  /* ── Toast ───────────────────────────────── */
  function showToast(msg, type = 'success') {
    let t = document.getElementById('globalToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'globalToast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.className = `toast ${type}`;
    t.textContent = (type === 'success' ? '✓ ' : '✕ ') + msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  /* ── Pagination helper ───────────────────── */
  function pagerHTML(total, page, pageSize, gotoFn) {
    if (total <= pageSize) return '';
    const pages  = Math.ceil(total / pageSize);
    const from   = page * pageSize + 1;
    const to     = Math.min((page + 1) * pageSize, total);
    const prev   = page > 0       ? `<button class="btn btn-secondary btn-sm" onclick="${gotoFn}(${page - 1})">← Prev</button>` : '';
    const next   = page < pages-1 ? `<button class="btn btn-secondary btn-sm" onclick="${gotoFn}(${page + 1})">Next →</button>` : '';
    return `<div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:10px 0;">
      <span style="font-size:12px;color:var(--text-muted);">${from}–${to} of ${total}</span>
      ${prev}${next}
    </div>`;
  }

  /* ── Print window helper (with popup-blocker fallback) ── */
  function openPrintWindow(html) {
    const w = window.open('', '_blank', 'width=560,height=720');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => { try { w.print(); } catch(e) {} }, 500);
      return;
    }
    // Popup blocked — open via Blob URL so it still works
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.target = '_blank'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch(e) {
      showToast('Popup blocked — allow popups for this site, then try again', 'error');
    }
  }

  /* ── Debounce ────────────────────────────── */
  function debounce(fn, ms = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }

  /* ── Loading overlay ─────────────────────── */
  function showLoadingOverlay(msg) {
    let el = document.getElementById('fleetLoadingOverlay');
    if (!el) {
      const style = document.createElement('style');
      style.textContent = '@keyframes fleetSpin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
      el = document.createElement('div');
      el.id = 'fleetLoadingOverlay';
      el.style.cssText = 'position:fixed;inset:0;background:var(--bg-base,#141d2b);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;gap:16px;';
      el.innerHTML = `<div style="width:36px;height:36px;border:3px solid rgba(42,157,143,.25);border-top-color:#2A9D8F;border-radius:50%;animation:fleetSpin .8s linear infinite;"></div>
        <div id="fleetLoadingMsg" style="font-size:13px;color:#94a3b8;font-family:Inter,sans-serif;"></div>`;
      document.body.appendChild(el);
    }
    const msgEl = document.getElementById('fleetLoadingMsg');
    if (msgEl) msgEl.textContent = msg || 'Loading…';
  }
  function hideLoadingOverlay() {
    const el = document.getElementById('fleetLoadingOverlay');
    if (el) el.remove();
  }

  /* ── Modal helpers ───────────────────────── */
  function openModal(id)  { const m = document.getElementById(id); if (m) m.classList.add('open'); }
  function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }

  /* ── Auth ────────────────────────────────── */
  function isLoggedIn() { return sessionStorage.getItem('fo_auth') === '1'; }
  function logout() {
    sessionStorage.removeItem('fo_auth');
    if (window.fbAuth) window.fbAuth.signOut().catch(() => {});
    location.href = 'login.html';
  }

  /* ── Init ────────────────────────────────── */
  function init(activePage) {
    if (!isLoggedIn()) { location.href = 'login.html'; return; }
    seed();
    renderShell(activePage);
    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
    });
    // Accessibility: label all ✕ close buttons
    document.querySelectorAll('.icon-btn').forEach(btn => {
      if (btn.textContent.trim() === '✕' && !btn.getAttribute('aria-label')) {
        btn.setAttribute('aria-label', 'Close');
      }
    });
    // Show Firebase Auth user email in topbar + sidebar when auth resolves
    if (window.fbAuth) {
      window.fbAuth.onAuthStateChanged(user => {
        if (!user) return;
        const email   = user.email || '';
        const initial = email ? email[0].toUpperCase() : 'O';
        const uname   = email ? email.split('@')[0] : 'Operator';
        const els = {
          topbarEmail:  document.getElementById('topbarUserEmail'),
          topbarAvatar: document.getElementById('topbarAvatar'),
          sidebarAv:    document.getElementById('sidebarAvatar'),
          sidebarName:  document.getElementById('sidebarUserName'),
          sidebarEmail: document.getElementById('sidebarUserEmail'),
        };
        if (els.topbarEmail)  { els.topbarEmail.textContent = email; els.topbarEmail.style.display = email ? '' : 'none'; els.topbarEmail.title = 'Signed in as ' + email; }
        if (els.topbarAvatar)  els.topbarAvatar.textContent  = initial;
        if (els.sidebarAv)     els.sidebarAv.textContent     = initial;
        if (els.sidebarName)   els.sidebarName.textContent   = uname;
        if (els.sidebarEmail)  els.sidebarEmail.textContent  = email;
      });
    }
  }

  return {
    // Data
    getVendors, getVehicles, getDrivers, getTrips, getPayouts, getSettings,
    getVendor, getVehicle, getDriver,
    getSalaryPayments,
    // Computed
    getVendorBalance, getVendorStats, getDashboardStats, getTripsByDay,
    getDriverSalaryStatus, getUnpaidSalariesForMonth,
    // Mutations
    addTrip, updateTrip, deleteTrip,
    addPayout, deletePayout, updatePayout,
    addVendor, updateVendor,
    addVehicle, updateVehicle,
    addDriver, updateDriver,
    addSalaryPayment, deleteSalaryPayment,
    deleteVendor, deleteVehicle, deleteDriver,
    restoreVendor, restoreVehicle, restoreDriver,
    getDeletedVendors, getDeletedVehicles, getDeletedDrivers,
    getAuditLog,
    buildTripReceiptHTML,
    buildPayoutReceiptHTML,
    buildVendorStatementHTML,
    updateSettings, clearTrips, clearPayouts,
    exportBackup, importBackup,
    getCustomers, getCustomer, addCustomer, updateCustomer, deleteCustomer,
    getDeletedCustomers, getCustomerBookings, getCustomerByPhone,
    getExpenses, getExpense, addExpense, updateExpense, deleteExpense, EXP_CATS,
    getFixedCosts, getFixedCost, addFixedCost, updateFixedCost, deleteFixedCost,
    getBookings, getBooking, getHoldBookings, addBooking, updateBooking, deleteBooking,
    getCustomerBookingHistory,
    getAdvances, addAdvance, settleAdvance, deleteAdvance, getDriverAdvanceSummary,
    // Helpers
    fmtMoney, fmtK, today, escapeHtml,
    // UI
    init, renderShell, showToast, openModal, closeModal, openPrintWindow, pagerHTML, debounce,
    showLoadingOverlay, hideLoadingOverlay,
    toggleTheme, getTheme, setTheme,
    toggleSidebar, closeSidebar,
    isLoggedIn, logout,
    reset, cleanSlate,
  };
})();
