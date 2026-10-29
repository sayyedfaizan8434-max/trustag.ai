const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = 'trusttag_secret_2026';

app.use(cors());
app.use(express.json());

// PWA Manifest
app.get('/manifest.json', (req, res) => {
  res.json({
    name: "TrustTag AI - Product Authenticity",
    short_name: "TrustTag AI",
    start_url: "/",
    display: "standalone",
    background_color: "#0a192f",
    theme_color: "#0ea5e9",
    icons: [
      { src: "https://cdn-icons-png.flaticon.com/512/9422/9422891.png", sizes: "192x192", type: "image/png" },
      { src: "https://cdn-icons-png.flaticon.com/512/9422/9422891.png", sizes: "512x512", type: "image/png" }
    ]
  });
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send("self.addEventListener('install', e => self.skipWaiting()); self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));");
});

let db = {
  users: [{ id: "admin", name: "Admin", email: "admin@trusttag.local", passwordHash: bcrypt.hashSync("AdminRealPass@2026", 10), role: "admin" }],
  products: [
    { productIdentifier: "8901058852441", productName: "Maggi 2-Minute Masala Instant Noodles (70g)", brand: "Nestle India", batchNumber: "MAG-2026-IN09", mrp: 14.00, source: "GS1 India Master Registry" },
    { productIdentifier: "8901117002016", productName: "Dolo-650 Paracetamol IP Tablets (15 Tab)", brand: "Micro Labs Ltd", batchNumber: "DOLO-650-B441", mrp: 34.00, source: "CDSCO Central Drug Registry" },
    { productIdentifier: "FAKE-COSMETIC-001", productName: "Luxury Glow Vitamin C Serum (30ml)", brand: "DermaBright Organics", batchNumber: "FAKE-LOT-007", mrp: 899.00, source: "Consumer Division" }
  ],
  reports: [
    { id: "rep_1", reportedIdentifier: "FAKE-COSMETIC-001", reason: "Poor packaging or spelling errors", description: "Misspells Dermatologist as Dermatlogist. Cap seal broken." }
  ]
};

app.post('/api/auth/register', (req, res) => {
  let { name, email, password } = req.body;
  email = (email || '').toLowerCase().trim();
  password = (password || '').trim();
  name = (name || 'Consumer').trim();
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  if (db.users.some(u => u.email === email)) return res.status(400).json({ message: 'Email already registered' });
  const newUser = { id: 'usr_' + Date.now(), name, email, passwordHash: bcrypt.hashSync(password, 10), role: 'user' };
  db.users.push(newUser);
  const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '15d' });
  res.status(201).json({ message: 'Registration successful', token, user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  let { email, password } = req.body;
  email = (email || '').toLowerCase().trim();
  password = (password || '').trim();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: 'User not found. Please register first.' });
  const isMatch = bcrypt.compareSync(password, user.passwordHash) || (user.role === 'admin' && password === 'AdminRealPass@2026');
  if (!isMatch) return res.status(401).json({ message: 'Incorrect password.' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '15d' });
  res.json({ message: 'Login successful', token, user });
});

app.post('/api/verify-product', (req, res) => {
  const cleanId = (req.body.identifier || '').trim().toUpperCase();
  if (!cleanId) return res.status(400).json({ outcome: 'INSUFFICIENT_INFORMATION' });
  const product = db.products.find(p => p.productIdentifier === cleanId);
  const reports = db.reports.filter(r => r.reportedIdentifier === cleanId);
  if (!product) return res.json({ outcome: 'NOT_FOUND', queriedIdentifier: cleanId });
  if (reports.length > 0) return res.json({ outcome: 'WARNING', product, reports });
  return res.json({ outcome: 'VERIFIED', product });
});

app.post('/api/reports', (req, res) => {
  const { reportedIdentifier, reason, description } = req.body;
  const newReport = { id: 'rep_' + Date.now(), reportedIdentifier: (reportedIdentifier || '').trim().toUpperCase(), reason: reason || 'Suspicious', description: description || '' };
  db.reports.unshift(newReport);
  res.status(201).json({ message: 'Report submitted successfully' });
});

app.get('*', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TrustTag AI - Product Authenticity System</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#0b1329">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <script src="https://unpkg.com/html5-qrcode"></script>
  <style>
    body { background-color: #0b1329; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
    .card-dark { background: #152238; border: 1px solid #233554; border-radius: 16px; }
    
    /* Modern 3-Tab App Navigation */
    .btn-nav-tab { background: #152238; color: #94a3b8; border: 1px solid #233554; border-radius: 12px; padding: 0.6rem 0.2rem; font-weight: 600; font-size: 0.85rem; transition: all 0.2s; }
    .btn-nav-tab.active { background: #0ea5e9; color: #000; font-weight: 700; border-color: #0ea5e9; box-shadow: 0 0 15px rgba(14, 165, 233, 0.4); }
    
    /* App Install Button (Subtle & Auto-Hides) */
    .btn-install-app { background: #f59e0b; color: #000; font-weight: 700; border-radius: 20px; font-size: 0.8rem; padding: 0.35rem 0.85rem; border: none; }
    
    /* Avatar Circle */
    .profile-avatar { width: 75px; height: 75px; background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; font-size: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3); }

    #qr-reader { border: 2px dashed #0ea5e9; border-radius: 14px; background: #000; overflow: hidden; }
    #qr-reader video { width: 100% !important; border-radius: 12px; }
  </style>
</head>
<body>

  <!-- Clean Top Bar -->
  <header class="bg-black py-2 px-3 border-bottom border-secondary sticky-top">
    <div class="container d-flex justify-content-between align-items-center">
      <a class="navbar-brand fw-bold text-info fs-5 d-flex align-items-center mb-0" href="/">
        <i class="bi bi-shield-check fs-4 me-2 text-info"></i> TrustTag AI
      </a>
      
      <!-- Right Side: Auto-Hides when Installed -->
      <div class="d-flex align-items-center gap-2">
        <button id="btnDownloadApp" class="btn btn-install-app shadow-sm" onclick="downloadAppPrompt()">
          <i class="bi bi-cloud-arrow-down-fill me-1"></i> Install App
        </button>
      </div>
    </div>
  </header>

  <div class="container my-3 flex-grow-1">
    
    <!-- Systematic 3-Button Row (Single line on mobile) -->
    <div class="row g-2 mb-3">
      <div class="col-4">
        <button class="btn btn-nav-tab w-100 active" id="tabBtn-verify" onclick="showSec('verify')">
          <i class="bi bi-qr-code-scan d-block fs-5 mb-1"></i> Verify
        </button>
      </div>
      <div class="col-4">
        <button class="btn btn-nav-tab w-100" id="tabBtn-report" onclick="showSec('report')">
          <i class="bi bi-flag-fill d-block fs-5 mb-1"></i> Report
        </button>
      </div>
      <div class="col-4">
        <button class="btn btn-nav-tab w-100" id="tabBtn-auth" onclick="showSec('auth')">
          <i class="bi bi-person-circle d-block fs-5 mb-1"></i> <span id="tabUserLabel">Account</span>
        </button>
      </div>
    </div>

    <!-- 1. VERIFY SECTION -->
    <div id="sec-verify" class="row justify-content-center">
      <div class="col-lg-7">
        <div class="card card-dark p-3 p-md-4 shadow-lg mb-3">
          <h4 class="fw-bold text-center text-white mb-1"><i class="bi bi-shield-check text-info me-2"></i>Verify Authenticity</h4>
          <p class="text-secondary small text-center mb-3">Check barcodes or scan package with your camera</p>

          <div class="input-group mb-3">
            <input type="text" id="barcodeIn" class="form-control bg-dark text-white border-secondary" placeholder="Enter Barcode or ID">
            <button class="btn btn-info fw-bold text-dark px-3" onclick="doVerify()"><i class="bi bi-search me-1"></i> Check</button>
          </div>

          <div class="text-center my-2">
            <button class="btn btn-outline-info px-4 py-2 fw-semibold" id="btnCamStart" onclick="startCam()">
              <i class="bi bi-camera-fill me-1"></i> Open Camera Scanner
            </button>
            <button class="btn btn-danger px-4 py-2 fw-semibold d-none" id="btnCamStop" onclick="stopCam()">
              <i class="bi bi-stop-circle-fill me-1"></i> Stop Camera
            </button>
          </div>

          <div id="camMsg" class="small text-center fw-semibold text-secondary my-2"></div>
          <div id="qr-reader" class="my-2 mx-auto shadow-sm" style="max-width: 360px; display: none;"></div>

          <div class="mt-3 pt-3 border-top border-secondary text-center small text-secondary">
            <span class="d-block mb-2 fw-bold text-light">Quick Demo Test:</span>
            <div class="d-flex justify-content-center gap-1 flex-wrap">
              <button class="badge bg-secondary p-2 border-0" onclick="quick('8901058852441')">🍜 Maggi</button>
              <button class="badge bg-secondary p-2 border-0" onclick="quick('8901117002016')">💊 Dolo-650</button>
              <button class="badge bg-danger p-2 border-0" onclick="quick('FAKE-COSMETIC-001')">⚠️ Fake Serum</button>
            </div>
          </div>
        </div>
        <div id="verifyOut"></div>
      </div>
    </div>

    <!-- 2. REPORT SECTION -->
    <div id="sec-report" class="row justify-content-center d-none">
      <div class="col-lg-6">
        <div class="card card-dark p-3 p-md-4 shadow-lg">
          <h4 class="fw-bold text-center text-danger mb-1"><i class="bi bi-flag-fill me-2"></i>Report Fake Product</h4>
          <p class="text-secondary small text-center mb-3">File an incident report to alert community consumers</p>
          <div id="repAlert" class="alert d-none"></div>

          <div class="mb-3">
            <label class="form-label text-light fw-bold small">Product Barcode / ID *</label>
            <input type="text" id="repId" class="form-control bg-dark text-white border-secondary" placeholder="e.g. 8901058852441">
          </div>
          <div class="mb-3">
            <label class="form-label text-light fw-bold small">Reason for Suspicion *</label>
            <select id="repReason" class="form-select bg-dark text-white border-secondary">
              <option value="Poor packaging or spelling errors">Poor packaging or spelling errors</option>
              <option value="Broken safety seal">Broken safety seal</option>
              <option value="Suspiciously low price">Suspiciously low price</option>
              <option value="Altered expiry date">Altered expiry date</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label text-light fw-bold small">Description *</label>
            <textarea id="repDesc" class="form-control bg-dark text-white border-secondary" rows="3" placeholder="Describe defects, shop details, texture..."></textarea>
          </div>
          <button class="btn btn-danger w-100 py-2 fw-bold" onclick="submitRep()">
            <i class="bi bi-send-fill me-1"></i> Submit Report
          </button>
        </div>
      </div>
    </div>

    <!-- 3. UNIFIED ACCOUNT SECTION (Profile + Login + Logout All In One) -->
    <div id="sec-auth" class="row justify-content-center d-none">
      <div class="col-md-5">
        <div class="card card-dark p-3 p-md-4 shadow-lg">

          <!-- View A: User Profile Card (When Logged In) -->
          <div id="viewProfile" class="text-center d-none">
            <div class="profile-avatar mx-auto mb-3">👤</div>
            <h4 class="fw-bold text-white mb-1" id="profName">User</h4>
            <p class="text-secondary small mb-3" id="profEmail">user@gmail.com</p>
            <span class="badge bg-info text-dark fw-bold px-3 py-2 mb-3" id="profRole">Verified Consumer</span>

            <div class="row g-2 text-start p-3 bg-dark rounded-3 mb-4 border border-secondary small">
              <div class="col-6"><span class="text-secondary d-block">Account Status</span><strong class="text-success">Active 🟢</strong></div>
              <div class="col-6"><span class="text-secondary d-block">Security Tier</span><strong class="text-white">Cloud 24/7</strong></div>
            </div>

            <button class="btn btn-outline-danger w-100 py-2 fw-bold" onclick="logout()">
              <i class="bi bi-box-arrow-right me-1"></i> Log Out from Account
            </button>
          </div>

          <!-- View B: Login / Register Form (When Logged Out) -->
          <div id="viewAuthForm">
            <h4 class="fw-bold text-center text-white mb-1" id="authTitle">Sign In</h4>
            <p class="text-secondary small text-center mb-3" id="authSub">Log in with your Gmail or registered account</p>
            <div id="authAlert" class="alert d-none"></div>

            <div class="mb-3 d-none" id="nameBox">
              <label class="form-label text-light fw-bold small">Full Name</label>
              <input type="text" id="authName" class="form-control bg-dark text-white border-secondary" placeholder="e.g. Faizuu">
            </div>
            <div class="mb-3">
              <label class="form-label text-light fw-bold small">Gmail / Email Address</label>
              <input type="email" id="authEmail" class="form-control bg-dark text-white border-secondary" placeholder="name@gmail.com">
            </div>
            <div class="mb-3">
              <label class="form-label text-light fw-bold small">Password</label>
              <input type="password" id="authPass" class="form-control bg-dark text-white border-secondary" placeholder="••••••••">
            </div>
            <button class="btn btn-info text-dark fw-bold w-100 py-2 mb-3" id="btnAuthSubmit" onclick="authDo()">
              Log In
            </button>
            <div class="text-center small text-secondary">
              <a href="javascript:void(0)" class="text-info fw-bold text-decoration-none" onclick="toggleAuth()" id="authLink">
                Don't have an account? Register here
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>

  </div>

  <!-- Download App Modal -->
  <div class="modal fade" id="installModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content bg-dark text-white border-info">
        <div class="modal-header border-secondary">
          <h5 class="modal-title fw-bold text-info"><i class="bi bi-phone me-2"></i>Install TrustTag AI App</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body small">
          <h6 class="fw-bold text-warning mb-2">📱 Android (Chrome):</h6>
          <p class="text-light">Top <strong>3 dots (⋮)</strong> par click karke <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> select karein. App install ho jayegi!</p>
          <hr class="border-secondary my-3">
          <h6 class="fw-bold text-info mb-2">🍏 iPhone (Safari):</h6>
          <p class="text-light">Niche <strong>Share icon (↑)</strong> par tap karke <strong>"Add to Home Screen"</strong> par click karein.</p>
        </div>
      </div>
    </div>
  </div>

  <footer class="bg-black text-secondary text-center py-3 border-top border-secondary small mt-auto">
    &copy; 2026 TrustTag AI &bull; Smart Anti-Counterfeit Platform
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    let deferredPrompt, scanner = null, isReg = false;

    // Detect if app is already installed or opened in standalone mode -> AUTO-HIDE BUTTON!
    function checkPWAInstalled() {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true || 
                           localStorage.getItem('trusttag_installed') === 'true';
      const btn = document.getElementById('btnDownloadApp');
      if (btn) {
        if (isStandalone) {
          btn.style.setProperty('display', 'none', 'important');
        } else {
          btn.style.removeProperty('display');
        }
      }
    }
    checkPWAInstalled();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      checkPWAInstalled();
    });

    window.addEventListener('appinstalled', () => {
      localStorage.setItem('trusttag_installed', 'true');
      checkPWAInstalled();
    });

    function downloadAppPrompt() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
      } else {
        new bootstrap.Modal(document.getElementById('installModal')).show();
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }

    // 3-Tab Controller
    function showSec(s) {
      ['verify', 'report', 'auth'].forEach(k => {
        document.getElementById('sec-' + k).classList.add('d-none');
        document.getElementById('tabBtn-' + k).classList.remove('active');
      });
      document.getElementById('sec-' + s).classList.remove('d-none');
      document.getElementById('tabBtn-' + s).classList.add('active');
      renderAccountView();
    }

    // Render Unified Account View
    function renderAccountView() {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      const vProf = document.getElementById('viewProfile');
      const vForm = document.getElementById('viewAuthForm');
      const tabLabel = document.getElementById('tabUserLabel');

      if (u) {
        tabLabel.textContent = u.name.split(' ')[0];
        vProf.classList.remove('d-none');
        vForm.classList.add('d-none');
        document.getElementById('profName').textContent = u.name;
        document.getElementById('profEmail').textContent = u.email;
        document.getElementById('profRole').textContent = u.role === 'admin' ? 'System Administrator' : 'Verified Consumer Account';
      } else {
        tabLabel.textContent = 'Account';
        vProf.classList.add('d-none');
        vForm.classList.remove('d-none');
      }
    }

    function toggleAuth() {
      isReg = !isReg;
      document.getElementById('authTitle').textContent = isReg ? 'Create Account' : 'Sign In';
      document.getElementById('authSub').textContent = isReg ? 'Register with any Gmail & set custom password' : 'Log in with your Gmail or registered account';
      document.getElementById('btnAuthSubmit').textContent = isReg ? 'Register Now' : 'Log In';
      document.getElementById('nameBox').classList.toggle('d-none', !isReg);
      document.getElementById('authLink').textContent = isReg ? 'Already registered? Log in here' : "Don't have an account? Register here";
    }

    async function authDo() {
      const email = document.getElementById('authEmail').value, password = document.getElementById('authPass').value, name = document.getElementById('authName').value;
      const b = document.getElementById('authAlert');
      try {
        const res = await fetch(isReg ? '/api/auth/register' : '/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name })
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.message);
        localStorage.setItem('user', JSON.stringify(d.user));
        b.className = 'alert alert-success'; b.textContent = 'Welcome ' + d.user.name + '!'; b.classList.remove('d-none');
        renderAccountView();
        setTimeout(() => showSec('verify'), 700);
      } catch(e) { b.className = 'alert alert-danger'; b.textContent = e.message; b.classList.remove('d-none'); }
    }

    function logout() {
      localStorage.removeItem('user');
      renderAccountView();
      showSec('verify');
    }
    renderAccountView();

    function quick(id) { document.getElementById('barcodeIn').value = id; doVerify(); }
    async function doVerify() {
      const id = document.getElementById('barcodeIn').value.trim();
      const out = document.getElementById('verifyOut');
      if (!id) return;
      out.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-info"></div></div>';
      const res = await fetch('/api/verify-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: id }) });
      const d = await res.json();
      if (d.outcome === 'VERIFIED') {
        out.innerHTML = '<div class="card card-dark p-3 p-md-4 border-success"><div class="d-flex justify-content-between mb-2"><span class="badge bg-success p-2">AUTHENTIC RECORD FOUND</span><code>' + d.product.productIdentifier + '</code></div><h4 class="fw-bold text-white">' + d.product.productName + '</h4><p class="text-secondary small mb-1">Brand: <strong>' + d.product.brand + '</strong> | Batch: ' + d.product.batchNumber + ' | MRP: ₹' + d.product.mrp + '</p><small class="text-info"><i class="bi bi-database me-1"></i> Source: ' + d.product.source + '</small></div>';
      } else if (d.outcome === 'WARNING') {
        out.innerHTML = '<div class="card card-dark p-3 p-md-4 border-warning"><span class="badge bg-warning text-dark p-2 mb-2">WARNING: SUSPICIOUS REPORT REGISTERED</span><h4 class="fw-bold text-white">' + d.product.productName + '</h4><div class="alert alert-warning small my-2"><strong>Incident:</strong> ' + d.reports.map(r => r.reason + ' - ' + r.description).join('<br>') + '</div></div>';
      } else {
        out.innerHTML = '<div class="card card-dark p-3 p-md-4 border-danger"><span class="badge bg-danger p-2 mb-2">RECORD NOT FOUND</span><h5 class="fw-bold text-white">No match found in authorized database</h5><p class="text-secondary small">This product ID was not found in registered databases.</p></div>';
      }
    }

    // Camera Scanner
    async function startCam() {
      const msg = document.getElementById('camMsg');
      const reader = document.getElementById('qr-reader');
      msg.innerHTML = '<span class="text-info"><span class="spinner-border spinner-border-sm me-2"></span>Connecting camera...</span>';
      reader.style.display = 'block';

      try {
        if (!scanner) scanner = new Html5Qrcode("qr-reader");
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) throw new Error("No camera found on this device.");
        const camId = cameras.length > 1 ? cameras[cameras.length - 1].id : cameras[0].id;

        await scanner.start(
          camId,
          { fps: 15, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            msg.innerHTML = '<span class="text-success fw-bold"><i class="bi bi-check-circle me-1"></i> Scanned: ' + decoded + '</span>';
            document.getElementById('barcodeIn').value = decoded;
            stopCam();
            doVerify();
          },
          () => {}
        );
        document.getElementById('btnCamStart').classList.add('d-none');
        document.getElementById('btnCamStop').classList.remove('d-none');
        msg.innerHTML = '<span class="text-success"><i class="bi bi-camera-video me-1"></i> Camera Active — Point at barcode</span>';
      } catch (err) {
        msg.innerHTML = '<span class="text-danger"><i class="bi bi-exclamation-triangle me-1"></i> Camera Error: ' + (err.message || 'Permission denied') + '</span>';
        stopCam();
      }
    }

    async function stopCam() {
      if (scanner && scanner.isScanning) await scanner.stop();
      document.getElementById('btnCamStart').classList.remove('d-none');
      document.getElementById('btnCamStop').classList.add('d-none');
      document.getElementById('qr-reader').style.display = 'none';
      if (!document.getElementById('barcodeIn').value) document.getElementById('camMsg').innerHTML = '';
    }

    async function submitRep() {
      const id = document.getElementById('repId').value.trim(), reason = document.getElementById('repReason').value, desc = document.getElementById('repDesc').value.trim();
      const a = document.getElementById('repAlert');
      if (!id || !desc) { a.className = 'alert alert-danger'; a.textContent = 'Please fill all required fields'; a.classList.remove('d-none'); return; }
      await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportedIdentifier: id, reason, description: desc }) });
      a.className = 'alert alert-success'; a.textContent = 'Report submitted successfully!'; a.classList.remove('d-none');
      document.getElementById('repId').value = ''; document.getElementById('repDesc').value = '';
    }
  </script>
</body>
</html>`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('TrustTag AI Server running on port', PORT);
});
