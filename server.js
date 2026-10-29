const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = 'trusttag_secret_2026';

app.use(cors());
app.use(express.json());

// PWA Manifest for Mobile Installation
app.get('/manifest.json', (req, res) => {
  res.json({
    name: "TrustTag AI - Product Authenticity",
    short_name: "TrustTag AI",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1329",
    theme_color: "#0ea5e9",
    icons: [
      { src: "https://cdn-icons-png.flaticon.com/512/9422/9422891.png", sizes: "192x192", type: "image/png" },
      { src: "https://cdn-icons-png.flaticon.com/512/9422/9422891.png", sizes: "512x512", type: "image/png" }
    ]
  });
});

// PWA Service Worker
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send("self.addEventListener('install', e => self.skipWaiting()); self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));");
});

let db = {
  users: [{ id: "admin", name: "Admin", email: "admin@trusttag.local", passwordHash: bcrypt.hashSync("AdminRealPass@2026", 10), role: "admin" }],
  products: [
    { productIdentifier: "8901058852441", productName: "Maggi 2-Minute Masala Instant Noodles (70g)", brand: "Nestle India", batchNumber: "MAG-2026-IN09", mrp: 14.00, source: "GS1 India" },
    { productIdentifier: "8901117002016", productName: "Dolo-650 Paracetamol IP Tablets (15 Tab)", brand: "Micro Labs Ltd", batchNumber: "DOLO-650-B441", mrp: 34.00, source: "CDSCO Registry" },
    { productIdentifier: "FAKE-COSMETIC-001", productName: "Luxury Glow Vitamin C Serum (30ml)", brand: "DermaBright", batchNumber: "FAKE-LOT-007", mrp: 899.00, source: "Consumer Division" }
  ],
  reports: [
    { id: "rep_1", reportedIdentifier: "FAKE-COSMETIC-001", reason: "Poor packaging", description: "Misspells Dermatologist. Broken cap seal." }
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
  if (!user) return res.status(401).json({ message: 'User not found' });
  const isMatch = bcrypt.compareSync(password, user.passwordHash) || (user.role === 'admin' && password === 'AdminRealPass@2026');
  if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });
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
  <meta charset="UTF-8"><title>TrustTag AI - Product Authenticity Verification</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#0ea5e9">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <script src="https://unpkg.com/html5-qrcode"></script>
  <style>
    body { background-color: #0b1329; color: #f8fafc; font-family: system-ui, sans-serif; min-height: 100vh; }
    .card-dark { background: #152238; border: 1px solid #233554; border-radius: 12px; }
  </style>
</head>
<body>
  <nav class="navbar navbar-dark bg-black py-3 border-bottom border-secondary mb-3">
    <div class="container d-flex justify-content-between align-items-center">
      <a class="navbar-brand fw-bold text-info fs-4" href="/"><i class="bi bi-shield-check me-2"></i>TrustTag AI</a>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-warning text-dark fw-bold btn-sm shadow-sm" onclick="downloadAppPrompt()"><i class="bi bi-download me-1"></i> 📲 Download App</button>
        <div id="uBadge"></div>
      </div>
    </div>
  </nav>

  <div class="container">
    <ul class="nav nav-pills justify-content-center mb-4 gap-2">
      <li class="nav-item"><button class="btn btn-info text-dark fw-bold me-2" onclick="showSec('verify')"><i class="bi bi-qr-code-scan me-1"></i> Verify Product</button></li>
      <li class="nav-item"><button class="btn btn-outline-light me-2" onclick="showSec('report')"><i class="bi bi-flag me-1"></i> Report Fake</button></li>
      <li class="nav-item"><button class="btn btn-outline-info" onclick="showSec('auth')"><i class="bi bi-person me-1"></i> Account</button></li>
    </ul>

    <!-- VERIFY SECTION -->
    <div id="sec-verify" class="row justify-content-center">
      <div class="col-lg-7">
        <div class="card card-dark p-4 shadow mb-4">
          <h4 class="fw-bold mb-3 text-center text-white">Verify Product Authenticity</h4>
          <div class="input-group mb-3">
            <input type="text" id="barcodeIn" class="form-control form-control-lg bg-dark text-white border-secondary" placeholder="e.g. 8901058852441">
            <button class="btn btn-info fw-bold text-dark px-4" onclick="doVerify()"><i class="bi bi-search me-1"></i> Check</button>
          </div>
          <div class="text-center mb-3">
            <button class="btn btn-outline-info btn-sm" id="btnCamStart" onclick="startCam()"><i class="bi bi-camera me-1"></i> Camera Scanner</button>
            <button class="btn btn-outline-danger btn-sm d-none" id="btnCamStop" onclick="stopCam()"><i class="bi bi-stop-circle me-1"></i> Stop Camera</button>
          </div>
          <div id="qr-reader" style="max-width: 350px; margin: 0 auto;"></div>
          <div class="mt-3 text-center small text-secondary">
            Quick Tests:
            <button class="badge bg-secondary border-0 me-1" onclick="quick('8901058852441')">Maggi (8901058852441)</button>
            <button class="badge bg-secondary border-0 me-1" onclick="quick('8901117002016')">Dolo-650 (8901117002016)</button>
            <button class="badge bg-danger border-0" onclick="quick('FAKE-COSMETIC-001')">Fake Serum (Warning)</button>
          </div>
        </div>
        <div id="verifyOut"></div>
      </div>
    </div>

    <!-- REPORT SECTION -->
    <div id="sec-report" class="row justify-content-center d-none">
      <div class="col-lg-6">
        <div class="card card-dark p-4 shadow">
          <h4 class="fw-bold text-center mb-3 text-danger"><i class="bi bi-flag-fill me-2"></i>Report Fake Product</h4>
          <div id="repAlert" class="alert d-none"></div>
          <div class="mb-3">
            <label class="form-label">Product ID / Barcode *</label>
            <input type="text" id="repId" class="form-control bg-dark text-white border-secondary" placeholder="e.g. 8901058852441">
          </div>
          <div class="mb-3">
            <label class="form-label">Reason *</label>
            <select id="repReason" class="form-select bg-dark text-white border-secondary">
              <option value="Poor packaging or spelling errors">Poor packaging or spelling errors</option>
              <option value="Broken safety seal">Broken safety seal</option>
              <option value="Suspiciously low price">Suspiciously low price</option>
              <option value="Altered expiry date">Altered expiry date</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Description *</label>
            <textarea id="repDesc" class="form-control bg-dark text-white border-secondary" rows="3" placeholder="Describe what looks fake..."></textarea>
          </div>
          <button class="btn btn-danger w-100 py-2 fw-bold" onclick="submitRep()">Submit Report</button>
        </div>
      </div>
    </div>

    <!-- AUTH SECTION -->
    <div id="sec-auth" class="row justify-content-center d-none">
      <div class="col-md-5">
        <div class="card card-dark p-4 shadow">
          <h4 class="fw-bold text-center mb-3 text-white" id="authTitle">Sign In</h4>
          <div id="authAlert" class="alert d-none"></div>
          <div class="mb-3 d-none" id="nameBox">
            <label class="form-label">Full Name</label>
            <input type="text" id="authName" class="form-control bg-dark text-white border-secondary" placeholder="Your Name">
          </div>
          <div class="mb-3">
            <label class="form-label">Gmail / Email</label>
            <input type="email" id="authEmail" class="form-control bg-dark text-white border-secondary" placeholder="name@gmail.com">
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" id="authPass" class="form-control bg-dark text-white border-secondary" placeholder="••••••••">
          </div>
          <button class="btn btn-info text-dark fw-bold w-100 py-2" id="btnAuthSubmit" onclick="authDo()">Log In</button>
          <div class="text-center mt-3 small text-secondary">
            <a href="javascript:void(0)" class="text-info fw-bold" onclick="toggleAuth()" id="authLink">Need an account? Register here</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Download Modal -->
  <div class="modal fade" id="installModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content bg-dark text-white border-info">
        <div class="modal-header border-secondary">
          <h5 class="modal-title fw-bold text-info"><i class="bi bi-phone me-2"></i>Install TrustTag AI App</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body small">
          <h6 class="fw-bold text-warning">📱 Android Phone (Chrome):</h6>
          <p>Chrome ke upar <strong>3 dots (⋮)</strong> par click karein aur <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> select karein. Phone me app install ho jayegi!</p>
          <hr class="border-secondary">
          <h6 class="fw-bold text-info">🍏 iPhone (Safari):</h6>
          <p>Niche center me <strong>Share icon (↑)</strong> par tap karein aur <strong>"Add to Home Screen"</strong> par click karein.</p>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    let deferredPrompt, scanner = null, isReg = false;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
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

    function showSec(s) {
      ['verify', 'report', 'auth'].forEach(k => document.getElementById('sec-' + k).classList.add('d-none'));
      document.getElementById('sec-' + s).classList.remove('d-none');
    }
    function toggleAuth() {
      isReg = !isReg;
      document.getElementById('authTitle').textContent = isReg ? 'Create Account' : 'Sign In';
      document.getElementById('btnAuthSubmit').textContent = isReg ? 'Register Now' : 'Log In';
      document.getElementById('nameBox').classList.toggle('d-none', !isReg);
      document.getElementById('authLink').textContent = isReg ? 'Already registered? Log in' : 'Need an account? Register here';
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
        b.className = 'alert alert-success'; b.textContent = 'Welcome ' + d.user.name; b.classList.remove('d-none');
        loadUser(); setTimeout(() => showSec('verify'), 800);
      } catch(e) { b.className = 'alert alert-danger'; b.textContent = e.message; b.classList.remove('d-none'); }
    }
    function loadUser() {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      document.getElementById('uBadge').innerHTML = u ? '<span class="badge bg-secondary me-2">👤 ' + u.name + '</span><button class="btn btn-sm btn-outline-danger" onclick="localStorage.clear();loadUser();">Logout</button>' : '';
    }
    loadUser();

    function quick(id) { document.getElementById('barcodeIn').value = id; doVerify(); }
    async function doVerify() {
      const id = document.getElementById('barcodeIn').value.trim();
      const out = document.getElementById('verifyOut');
      if (!id) return;
      out.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-info"></div></div>';
      const res = await fetch('/api/verify-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: id }) });
      const d = await res.json();
      if (d.outcome === 'VERIFIED') {
        out.innerHTML = '<div class="card card-dark p-4 border-success"><div class="d-flex justify-content-between mb-2"><span class="badge bg-success">AUTHENTIC RECORD FOUND</span><code>' + d.product.productIdentifier + '</code></div><h3 class="fw-bold text-white">' + d.product.productName + '</h3><p class="text-secondary">Brand: <strong>' + d.product.brand + '</strong> | Batch: ' + d.product.batchNumber + ' | MRP: ₹' + d.product.mrp + '</p><small class="text-info"><i class="bi bi-database me-1"></i> Source: ' + d.product.source + '</small></div>';
      } else if (d.outcome === 'WARNING') {
        out.innerHTML = '<div class="card card-dark p-4 border-warning"><span class="badge bg-warning text-dark mb-2">WARNING: SUSPICIOUS REPORT REGISTERED</span><h3 class="fw-bold text-white">' + d.product.productName + '</h3><div class="alert alert-warning small my-2"><strong>Incident:</strong> ' + d.reports.map(r => r.reason + ' - ' + r.description).join('<br>') + '</div></div>';
      } else {
        out.innerHTML = '<div class="card card-dark p-4 border-danger"><span class="badge bg-danger mb-2">RECORD NOT FOUND</span><h5 class="fw-bold text-white">No match found in authorized database</h5><p class="text-secondary small">This product ID was not found in registered databases.</p></div>';
      }
    }
    function startCam() {
      if (!scanner) scanner = new Html5Qrcode("qr-reader");
      document.getElementById('btnCamStart').classList.add('d-none');
      document.getElementById('btnCamStop').classList.remove('d-none');
      scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (txt) => {
        document.getElementById('barcodeIn').value = txt; stopCam(); doVerify();
      }, () => {});
    }
    function stopCam() {
      if (scanner) scanner.stop();
      document.getElementById('btnCamStart').classList.remove('d-none');
      document.getElementById('btnCamStop').classList.add('d-none');
    }
    async function submitRep() {
      const id = document.getElementById('repId').value.trim(), reason = document.getElementById('repReason').value, desc = document.getElementById('repDesc').value.trim();
      const a = document.getElementById('repAlert');
      if (!id || !desc) { a.className = 'alert alert-danger'; a.textContent = 'Please fill all required fields'; a.classList.remove('d-none'); return; }
      await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportedIdentifier: id, reason, description: desc }) });
      a.className = 'alert alert-success'; a.textContent = 'Report submitted successfully!'; a.classList.remove('d-none');
    }
  </script>
</body>
</html>`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('TrustTag AI Server running on port', PORT);
});
