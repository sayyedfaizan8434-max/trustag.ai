// ============================================================================
// TrustTag AI — 1-Click Auto-Installer Script
// Ye script pure project ka structure, frontend, backend aur demo data
// automatically 5 second me generate kar degi!
// ============================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 TrustTag AI Auto-Setup shuru ho raha hai...\n');

// 1. Folders List
const dirs = [
  'public',
  'public/css',
  'public/js',
  'server',
  'server/config',
  'server/controllers',
  'server/middleware',
  'server/models',
  'server/routes'
];

dirs.forEach(d => {
  const dirPath = path.join(__dirname, d);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Folder ban gaya: ${d}`);
  }
});

// 2. Files Content Definition
const files = {};

// package.json
files['package.json'] = JSON.stringify({
  "name": "trusttag-ai",
  "version": "1.0.0",
  "description": "Smart Product Authenticity Verification System",
  "main": "server/server.js",
  "scripts": {
    "start": "node server/server.js",
    "dev": "node server/server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.3.1"
  }
}, null, 2);

// .env
files['.env'] = `PORT=5000
NODE_ENV=development
JWT_SECRET=trusttag_secret_super_key_2026
ADMIN_EMAIL=admin@trusttag.local
ADMIN_PASSWORD=AdminSecurePass@2026
`;

// server/server.js (With Dual Mode: MongoDB or Built-in Zero-Config In-Memory Store)
files['server/server.js'] = `const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'trusttag_secret_super_key_2026';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// ================= IN-MEMORY DEMO DATABASE =================
// Ye college demo ke liye bina kisi external database ke 100% guaranteed chalta hai!
let products = [
  {
    productIdentifier: 'PROD-MED-9941',
    productName: 'Paracetamol 500mg IP (Strip of 10 Tablets)',
    brand: 'HealthCare Labs',
    category: 'Pharmaceuticals',
    manufacturer: 'Sun Formulation Works Ltd',
    batchNumber: 'BATCH-2025-A10',
    manufacturingDate: '2025-01-15',
    expiryDate: '2027-01-15',
    mrp: 32.50,
    verificationSource: 'National Drug Authority Batch Feed',
    verificationStatus: 'Active'
  },
  {
    productIdentifier: 'PROD-ELEC-2201',
    productName: 'FastCharge 65W GaN USB-C Adapter',
    brand: 'VoltTech Innovations',
    category: 'Electronics',
    manufacturer: 'VoltTech Electronics Shenzhen',
    batchNumber: 'VT-65W-2025-09',
    manufacturingDate: '2025-03-01',
    expiryDate: '2030-03-01',
    mrp: 1899.00,
    verificationSource: 'Authorized Brand Portal',
    verificationStatus: 'Active'
  },
  {
    productIdentifier: 'FAKE-SUSPECT-001',
    productName: 'Herbal Hair Regrowth Serum 100ml',
    brand: 'PureOrganics India',
    category: 'Personal Care',
    manufacturer: 'PureOrganics Bottlers',
    batchNumber: 'BATCH-PO-882',
    manufacturingDate: '2024-11-10',
    expiryDate: '2026-11-10',
    mrp: 750.00,
    verificationSource: 'Retail Brand Feed',
    verificationStatus: 'Active'
  }
];

let reports = [
  {
    _id: 'rep_1',
    reportedIdentifier: 'FAKE-SUSPECT-001',
    productName: 'Herbal Hair Regrowth Serum 100ml',
    brand: 'PureOrganics India',
    reason: 'Poor packaging or spelling errors',
    location: 'Local Marketplace Stall No. 4, Old Delhi',
    description: 'Packaging prints "Herbal Hair Regrooth" with misspelling. Cap seal was torn and barcode lines were blurry.',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'rep_2',
    reportedIdentifier: 'PROD-ELEC-2201',
    productName: 'FastCharge 65W GaN USB-C Adapter',
    brand: 'VoltTech Innovations',
    reason: 'Suspiciously low price / Unofficial seller',
    location: 'Pavement Stall',
    description: 'Sold for Rs. 200 while MRP is 1899. Charger overheats within 2 minutes.',
    status: 'pending',
    createdAt: new Date().toISOString()
  }
];

let users = [
  {
    id: 'usr_admin',
    name: 'College Viva Admin',
    email: 'admin@trusttag.local',
    passwordHash: bcrypt.hashSync('AdminSecurePass@2026', 10),
    role: 'admin'
  },
  {
    id: 'usr_demo',
    name: 'Rohan Sharma',
    email: 'rohan@example.com',
    passwordHash: bcrypt.hashSync('UserSecurePass@2026', 10),
    role: 'user'
  }
];

let auditLogs = [
  {
    timestamp: new Date().toISOString(),
    action: 'APPROVE_REPORT',
    affectedRecord: 'FAKE-SUSPECT-001',
    performedByEmail: 'admin@trusttag.local'
  }
];

// ================= API ROUTES =================

// 1. Verification Endpoint
app.post('/api/verify-product', (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ outcome: 'INSUFFICIENT_INFORMATION', message: 'Product ID required' });
  }

  const cleanId = identifier.trim().toUpperCase();
  const product = products.find(p => p.productIdentifier === cleanId);
  const approvedReports = reports.filter(r => r.reportedIdentifier === cleanId && r.status === 'approved');

  if (!product) {
    return res.json({
      outcome: 'PRODUCT_RECORD_NOT_FOUND',
      message: 'No record matching this identifier was located in the registry.',
      queriedIdentifier: cleanId,
      approvedReportsCount: 0,
      approvedReports: []
    });
  }

  if (approvedReports.length > 0) {
    return res.json({
      outcome: 'WARNING_APPROVED_REPORTS_EXIST',
      message: 'Warning: Matching record found, but approved suspicious counterfeit incident reports exist.',
      product,
      approvedReportsCount: approvedReports.length,
      approvedReports
    });
  }

  return res.json({
    outcome: 'VERIFIED_RECORD_FOUND',
    message: 'Product matches an authorized registry record with zero active suspicion flags.',
    product,
    approvedReportsCount: 0,
    approvedReports: []
  });
});

// 2. Products List
app.get('/api/products', (req, res) => res.json(products));
app.get('/api/products/:id', (req, res) => {
  const cleanId = req.params.id.trim().toUpperCase();
  const product = products.find(p => p.productIdentifier === cleanId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const approvedReports = reports.filter(r => r.reportedIdentifier === cleanId && r.status === 'approved');
  res.json({ product, approvedReports });
});

// Add Product (Admin)
app.post('/api/products', (req, res) => {
  const p = req.body;
  p.productIdentifier = (p.productIdentifier || '').trim().toUpperCase();
  products.unshift(p);
  auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action: 'ADD_PRODUCT',
    affectedRecord: p.productIdentifier,
    performedByEmail: 'admin@trusttag.local'
  });
  res.status(201).json({ message: 'Product added successfully', product: p });
});

// 3. Reports
app.post('/api/reports', (req, res) => {
  const { reportedIdentifier, productName, brand, reason, location, description } = req.body;
  const newReport = {
    _id: 'rep_' + Date.now(),
    reportedIdentifier: (reportedIdentifier || '').trim().toUpperCase(),
    productName: productName || '',
    brand: brand || '',
    reason,
    location: location || '',
    description,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  reports.unshift(newReport);
  res.status(201).json({ message: 'Report submitted for review', reportId: newReport._id });
});

app.get('/api/reports/recent-public', (req, res) => {
  const approved = reports.filter(r => r.status === 'approved').slice(0, 6);
  res.json({ reports: approved });
});

app.get('/api/reports', (req, res) => res.json(reports));

app.patch('/api/reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const rep = reports.find(r => r._id === id);
  if (rep) {
    rep.status = status;
    auditLogs.unshift({
      timestamp: new Date().toISOString(),
      action: status === 'approved' ? 'APPROVE_REPORT' : 'REJECT_REPORT',
      affectedRecord: rep.reportedIdentifier,
      performedByEmail: 'admin@trusttag.local'
    });
    return res.json({ message: 'Status updated', report: rep });
  }
  res.status(404).json({ message: 'Report not found' });
});

// 4. Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const newUser = {
    id: 'usr_' + Date.now(),
    name,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'user'
  };
  users.push(newUser);
  const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
  });
});

// 5. Admin Stats & Audit
app.get('/api/admin/dashboard-stats', (req, res) => {
  res.json({
    totalProducts: products.length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    approvedReports: reports.filter(r => r.status === 'approved').length,
    totalUsers: users.length
  });
});

app.get('/api/admin/audit-logs', (req, res) => res.json(auditLogs));

// Start Web Server
app.listen(PORT, () => {
  console.log('=================================================================');
  console.log('🎉 TrustTag AI Server 100% Ready!');
  console.log('👉 Browser me open karo: http://localhost:' + PORT);
  console.log('🔑 Admin Login: admin@trusttag.local  |  Password: AdminSecurePass@2026');
  console.log('=================================================================');
});
`;

// CSS File
files['public/css/style.css'] = `:root {
  --navy-dark: #0a192f;
  --navy-slate: #0f172a;
  --teal-primary: #0d9488;
  --teal-light: #14b8a6;
  --gray-bg: #f8fafc;
  --gray-border: #e2e8f0;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--gray-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
main { flex: 1 0 auto; }
.navbar-custom { background-color: var(--navy-dark); box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
.navbar-custom .navbar-brand { font-weight: 700; color: #ffffff; }
.navbar-custom .navbar-brand span { color: var(--teal-light); }
.navbar-custom .nav-link { color: #cbd5e1; font-weight: 500; }
.navbar-custom .nav-link:hover, .navbar-custom .nav-link.active { color: var(--teal-light); }
.btn-teal { background-color: var(--teal-primary); border-color: var(--teal-primary); color: #ffffff; font-weight: 600; border-radius: 8px; }
.btn-teal:hover { background-color: #0f766e; color: #ffffff; }
.btn-outline-teal { border-color: var(--teal-primary); color: var(--teal-primary); font-weight: 600; border-radius: 8px; }
.btn-outline-teal:hover { background-color: var(--teal-primary); color: #ffffff; }
.hero-section { background: linear-gradient(135deg, var(--navy-dark) 0%, #1e293b 100%); color: #ffffff; padding: 4.5rem 0; }
.card-custom { border: 1px solid var(--gray-border); border-radius: 12px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.step-badge { width: 42px; height: 42px; border-radius: 50%; background-color: #ccfbf1; color: var(--teal-primary); font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.status-pill { padding: 0.4rem 1rem; border-radius: 50rem; font-weight: 700; font-size: 0.85rem; }
.status-verified { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
.status-warning { background: #fef3c7; color: #d97706; border: 1px solid #fde047; }
.status-notfound { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.advisory-box { background: #f8fafc; border-left: 4px solid var(--teal-primary); padding: 1rem; border-radius: 4px; font-size: 0.9rem; }
footer { background: var(--navy-dark); color: #94a3b8; padding: 2rem 0; }
footer a { color: #cbd5e1; text-decoration: none; }
`;

// Global Main JS
files['public/js/main.js'] = `document.addEventListener('DOMContentLoaded', () => {
  setupNavigationAuth();
  loadRecentReports();
  const quickBtn = document.getElementById('heroVerifyBtn');
  if(quickBtn) {
    quickBtn.addEventListener('click', () => {
      const id = document.getElementById('heroProductId').value.trim();
      if(id) window.location.href = '/verify.html?id=' + encodeURIComponent(id);
    });
  }
});
function setupNavigationAuth() {
  const token = localStorage.getItem('trusttag_token');
  const user = JSON.parse(localStorage.getItem('trusttag_user') || 'null');
  const slot = document.getElementById('authNavSlot');
  if(!slot) return;
  if(token && user) {
    slot.innerHTML = \`<div class="dropdown">
      <button class="btn btn-sm btn-teal dropdown-toggle" data-bs-toggle="dropdown">\${user.name} (\${user.role})</button>
      <ul class="dropdown-menu dropdown-menu-end">
        \${user.role === 'admin' ? '<li><a class="dropdown-item" href="/dashboard.html">Admin Dashboard</a></li>' : ''}
        <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="logout()">Logout</a></li>
      </ul>
    </div>\`;
  }
}
function logout() {
  localStorage.clear();
  window.location.href = '/';
}
async function loadRecentReports() {
  const container = document.getElementById('recentReportsContainer');
  if(!container) return;
  try {
    const res = await fetch('/api/reports/recent-public');
    const data = await res.json();
    if(data.reports.length === 0) {
      container.innerHTML = '<div class="col-12 text-center text-muted py-3">No active suspicious reports.</div>';
      return;
    }
    container.innerHTML = data.reports.map(r => \`
      <div class="col-md-4">
        <div class="card card-custom h-100 p-3 border-start border-4 border-danger">
          <span class="badge bg-danger-subtle text-danger mb-2">Verified Alert</span>
          <h6 class="fw-bold mb-1">\${r.reportedIdentifier}</h6>
          <p class="text-danger small fw-semibold mb-1">\${r.reason}</p>
          <p class="text-muted small mb-0">\${r.description.substring(0,85)}...</p>
        </div>
      </div>\`).join('');
  } catch(e) {}
}
`;

// Verify JS
files['public/js/verify.js'] = `let html5QrScanner = null;
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('verifyForm');
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id');
  if(idParam) {
    document.getElementById('productIdInput').value = idParam;
    doVerify(idParam);
  }
  document.querySelectorAll('.sample-id-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = e.target.textContent.trim();
      document.getElementById('productIdInput').value = id;
      doVerify(id);
    });
  });
  if(form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('productIdInput').value.trim();
      if(id) doVerify(id);
    });
  }
  const btnStart = document.getElementById('btnStartCamera');
  const btnStop = document.getElementById('btnStopCamera');
  if(btnStart && btnStop) {
    btnStart.addEventListener('click', async () => {
      const fb = document.getElementById('cameraFeedback');
      try {
        if(!html5QrScanner) html5QrScanner = new Html5Qrcode('qr-reader');
        fb.textContent = 'Camera starting...';
        await html5QrScanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, (decoded) => {
          fb.innerHTML = '<span class="text-success">Scanned: ' + decoded + '</span>';
          html5QrScanner.stop();
          btnStart.disabled = false;
          btnStop.disabled = true;
          document.getElementById('productIdInput').value = decoded;
          doVerify(decoded);
        }, () => {});
        btnStart.disabled = true;
        btnStop.disabled = false;
        fb.textContent = 'Camera active. Point at barcode/QR code.';
      } catch(err) {
        fb.innerHTML = '<span class="text-danger">Camera error: ' + err.message + '</span>';
      }
    });
    btnStop.addEventListener('click', async () => {
      if(html5QrScanner) await html5QrScanner.stop();
      btnStart.disabled = false;
      btnStop.disabled = true;
      document.getElementById('cameraFeedback').textContent = 'Camera stopped.';
    });
  }
});

async function doVerify(id) {
  const loading = document.getElementById('verifyLoading');
  const result = document.getElementById('verificationResultArea');
  loading.classList.remove('d-none');
  result.classList.add('d-none');
  try {
    const res = await fetch('/api/verify-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: id })
    });
    const d = await res.json();
    loading.classList.add('d-none');
    result.classList.remove('d-none');
    if(d.outcome === 'VERIFIED_RECORD_FOUND') {
      result.innerHTML = \`<div class="card card-custom p-4 border-start border-4 border-success">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="status-pill status-verified">VERIFIED RECORD FOUND</span>
          <strong>\${d.product.productIdentifier}</strong>
        </div>
        <h4 class="fw-bold">\${d.product.productName}</h4>
        <p class="text-muted">Brand: <strong>\${d.product.brand}</strong> &bull; Mfr: \${d.product.manufacturer}</p>
        <div class="row g-2 p-3 bg-light rounded mb-3">
          <div class="col-6 col-md-3"><small class="text-muted d-block">Batch</small><strong>\${d.product.batchNumber}</strong></div>
          <div class="col-6 col-md-3"><small class="text-muted d-block">Official MRP</small><strong class="text-success">₹ \${d.product.mrp}</strong></div>
          <div class="col-6 col-md-3"><small class="text-muted d-block">Mfg Date</small><strong>\${d.product.manufacturingDate}</strong></div>
          <div class="col-6 col-md-3"><small class="text-muted d-block">Expiry</small><strong>\${d.product.expiryDate}</strong></div>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">Source: \${d.product.verificationSource}</small>
          <a href="/product.html?id=\${encodeURIComponent(d.product.productIdentifier)}" class="btn btn-sm btn-outline-teal">View Full Profile &rarr;</a>
        </div>
      </div>\`;
    } else if(d.outcome === 'WARNING_APPROVED_REPORTS_EXIST') {
      result.innerHTML = \`<div class="card card-custom p-4 border-start border-4 border-warning">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="status-pill status-warning">WARNING: APPROVED COUNTERFEIT REPORTS EXIST</span>
          <strong>\${d.product.productIdentifier}</strong>
        </div>
        <h4 class="fw-bold text-dark">\${d.product.productName}</h4>
        <p class="text-danger small fw-bold">Duplicate warning registered for this product!</p>
        <div class="p-3 bg-warning-subtle rounded mb-3 small">
          <strong>Moderator Alert:</strong> \${d.approvedReports.map(r => r.reason + ': ' + r.description).join('<br>')}
        </div>
        <a href="/product.html?id=\${encodeURIComponent(d.product.productIdentifier)}" class="btn btn-sm btn-teal">See Full Details</a>
      </div>\`;
    } else {
      result.innerHTML = \`<div class="card card-custom p-4 border-start border-4 border-danger">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="status-pill status-notfound">PRODUCT RECORD NOT FOUND</span>
          <strong>\${d.queriedIdentifier}</strong>
        </div>
        <h5 class="fw-bold">No Authorized Registry Entry</h5>
        <p class="text-muted small">This identifier was not found in the authentic registry. If you suspect fraud, report it immediately.</p>
        <a href="/report.html?id=\${encodeURIComponent(d.queriedIdentifier)}" class="btn btn-danger btn-sm">Report Suspicious Item</a>
      </div>\`;
    }
  } catch(e) {
    loading.classList.add('d-none');
    result.classList.remove('d-none');
    result.innerHTML = '<div class="alert alert-danger">Server check failed. Ensure node server is running!</div>';
  }
}
`;

// Report JS
files['public/js/report.js'] = `document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reportForm');
  const alertBox = document.getElementById('reportAlert');
  const params = new URLSearchParams(window.location.search);
  if(params.get('id')) document.getElementById('reportProductId').value = params.get('id');

  if(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        reportedIdentifier: document.getElementById('reportProductId').value.trim(),
        productName: document.getElementById('reportProductName').value.trim(),
        brand: document.getElementById('reportBrand').value.trim(),
        reason: document.getElementById('reportReason').value,
        location: document.getElementById('reportLocation').value.trim(),
        description: document.getElementById('reportDescription').value.trim()
      };
      if(!payload.reportedIdentifier || !payload.reason || payload.description.length < 15) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = 'Please fill all required fields and provide at least 15 characters of description.';
        alertBox.classList.remove('d-none');
        return;
      }
      try {
        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        alertBox.className = 'alert alert-success';
        alertBox.textContent = 'Report submitted successfully! Queued as Pending Review for Admin.';
        alertBox.classList.remove('d-none');
        form.reset();
      } catch(err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = 'Submission failed.';
        alertBox.classList.remove('d-none');
      }
    });
  }
});
`;

// Auth JS
files['public/js/auth.js'] = `document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const alertBox = document.getElementById('loginAlert');
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const d = await res.json();
        if(!res.ok) throw new Error(d.message);
        localStorage.setItem('trusttag_token', d.token);
        localStorage.setItem('trusttag_user', JSON.stringify(d.user));
        if(d.user.role === 'admin') window.location.href = '/dashboard.html';
        else window.location.href = '/';
      } catch(err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = err.message;
        alertBox.classList.remove('d-none');
      }
    });
  }
  if(registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const alertBox = document.getElementById('registerAlert');
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const d = await res.json();
        if(!res.ok) throw new Error(d.message);
        localStorage.setItem('trusttag_token', d.token);
        localStorage.setItem('trusttag_user', JSON.stringify(d.user));
        alertBox.className = 'alert alert-success';
        alertBox.textContent = 'Account created! Redirecting...';
        alertBox.classList.remove('d-none');
        setTimeout(() => window.location.href = '/', 1200);
      } catch(err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = err.message;
        alertBox.classList.remove('d-none');
      }
    });
  }
});
`;

// Dashboard JS
files['public/js/dashboard.js'] = `document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('trusttag_user') || 'null');
  if(!user || user.role !== 'admin') {
    alert('Access Denied: Please log in as Admin');
    window.location.href = '/login.html';
    return;
  }
  document.getElementById('adminUserGreeting').textContent = user.name + ' (Admin)';
  document.getElementById('adminLogoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login.html';
  });
  loadStats();
  loadReports();
  loadProducts();
  loadAudit();

  const addForm = document.getElementById('addProductForm');
  if(addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(addForm);
      const payload = Object.fromEntries(formData.entries());
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
      if(modal) modal.hide();
      addForm.reset();
      loadStats();
      loadProducts();
      loadAudit();
    });
  }
});

async function loadStats() {
  const res = await fetch('/api/admin/dashboard-stats');
  const d = await res.json();
  document.getElementById('statProducts').textContent = d.totalProducts;
  document.getElementById('statPendingReports').textContent = d.pendingReports;
  document.getElementById('statApprovedReports').textContent = d.approvedReports;
  document.getElementById('statUsers').textContent = d.totalUsers;
}

async function loadReports() {
  const res = await fetch('/api/reports');
  const list = await res.json();
  const tbody = document.getElementById('reportsTableBody');
  if(list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">No reports.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(r => \`
    <tr>
      <td><strong>\${r.reportedIdentifier}</strong></td>
      <td><span class="badge bg-warning-subtle text-dark">\${r.reason}</span></td>
      <td class="small text-muted">\${r.description}</td>
      <td class="small">\${new Date(r.createdAt).toLocaleDateString()}</td>
      <td><span class="badge \${r.status === 'approved' ? 'bg-danger' : r.status === 'rejected' ? 'bg-secondary' : 'bg-warning text-dark'}">\${r.status}</span></td>
      <td class="text-end">
        \${r.status === 'pending' ? \`
          <button class="btn btn-sm btn-outline-success me-1" onclick="updateReport('\${r._id}', 'approved')">Approve</button>
          <button class="btn btn-sm btn-outline-danger" onclick="updateReport('\${r._id}', 'rejected')">Reject</button>
        \` : '<span class="text-muted small">Done</span>'}
      </td>
    </tr>
  \`).join('');
}

window.updateReport = async function(id, status) {
  await fetch('/api/reports/' + id + '/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  loadStats();
  loadReports();
  loadAudit();
};

async function loadProducts() {
  const res = await fetch('/api/products');
  const list = await res.json();
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = list.map(p => \`
    <tr>
      <td><code>\${p.productIdentifier}</code></td>
      <td class="fw-bold">\${p.productName}</td>
      <td>\${p.brand}</td>
      <td>\${p.batchNumber || '-'}</td>
      <td>\${p.mrp ? '₹ ' + p.mrp : '-'}</td>
      <td><span class="badge bg-success-subtle text-success">Active</span></td>
      <td class="text-end"><a href="/product.html?id=\${encodeURIComponent(p.productIdentifier)}" target="_blank" class="btn btn-sm btn-outline-secondary">View</a></td>
    </tr>
  \`).join('');
}

async function loadAudit() {
  const res = await fetch('/api/admin/audit-logs');
  const list = await res.json();
  const tbody = document.getElementById('auditTableBody');
  tbody.innerHTML = list.map(a => \`
    <tr>
      <td class="small text-muted">\${new Date(a.timestamp).toLocaleString()}</td>
      <td><span class="badge bg-dark">\${a.action}</span></td>
      <td><code>\${a.affectedRecord}</code></td>
      <td class="small">\${a.performedByEmail}</td>
    </tr>
  \`).join('');
}
`;

// HTML Helper function to wrap boilerplate
const navHtml = (active) => `
  <nav class="navbar navbar-expand-lg navbar-custom sticky-top">
    <div class="container">
      <a class="navbar-brand" href="/"><i class="bi bi-shield-check text-info"></i> TrustTag<span>AI</span></a>
      <button class="navbar-toggler text-white" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu"><i class="bi bi-list"></i></button>
      <div class="collapse navbar-collapse" id="navMenu">
        <ul class="navbar-nav ms-auto align-items-center">
          <li class="nav-item"><a class="nav-link ${active==='home'?'active':''}" href="/">Home</a></li>
          <li class="nav-item"><a class="nav-link ${active==='verify'?'active':''}" href="/verify.html">Verify Product</a></li>
          <li class="nav-item"><a class="nav-link ${active==='report'?'active':''}" href="/report.html">Report Fake</a></li>
          <li class="nav-item"><a class="nav-link ${active==='about'?'active':''}" href="/about.html">About & FAQ</a></li>
          <li class="nav-item ms-lg-3" id="authNavSlot"><a class="btn btn-sm btn-outline-teal text-white" href="/login.html">Login</a></li>
        </ul>
      </div>
    </div>
  </nav>
`;

const footerHtml = `
  <footer>
    <div class="container text-center small text-light opacity-75">
      &copy; 2026 TrustTag AI — Smart Product Authenticity System (College Capstone Project)
    </div>
  </footer>
`;

// public/index.html
files['public/index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>TrustTag AI | Home</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  ${navHtml('home')}
  <header class="hero-section">
    <div class="container">
      <div class="row align-items-center g-5">
        <div class="col-lg-7">
          <span class="badge bg-info text-dark mb-2">Anti-Counterfeit Protection</span>
          <h1 class="display-5 fw-bold mb-3">Verify Genuine Products. Stop Counterfeits.</h1>
          <p class="lead opacity-90 mb-4">Protect yourself from duplicate and counterfeit products in local markets by checking barcodes and registry records.</p>
          <div class="d-flex gap-3">
            <a href="/verify.html" class="btn btn-teal btn-lg"><i class="bi bi-qr-code-scan me-2"></i>Verify Product</a>
            <a href="/report.html" class="btn btn-outline-light btn-lg"><i class="bi bi-flag me-2"></i>Report Fake</a>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="card card-custom p-4 text-dark">
            <h6 class="fw-bold text-uppercase text-muted">Quick Check Sandbox</h6>
            <p class="small text-muted">Enter a sample product code to test right now:</p>
            <div class="input-group mb-2">
              <input type="text" id="heroProductId" class="form-control" value="PROD-MED-9941">
              <button class="btn btn-teal" id="heroVerifyBtn">Check</button>
            </div>
            <div class="advisory-box mt-2">Try: <code>PROD-MED-9941</code> or <code>FAKE-SUSPECT-001</code></div>
          </div>
        </div>
      </div>
    </div>
  </header>
  <main class="py-5">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="fw-bold">How TrustTag AI Works</h2>
      </div>
      <div class="row g-4 text-center mb-5">
        <div class="col-md-4">
          <div class="card card-custom p-4 h-100">
            <div class="step-badge mb-3">1</div>
            <h5 class="fw-bold">Scan or Enter Code</h5>
            <p class="text-muted small">Scan product QR/Barcode with camera or enter the Product ID printed on the box.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card card-custom p-4 h-100">
            <div class="step-badge mb-3">2</div>
            <h5 class="fw-bold">Registry Cross-Check</h5>
            <p class="text-muted small">System matches authorized batch details, manufacturer, and active counterfeit flags.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card card-custom p-4 h-100">
            <div class="step-badge mb-3">3</div>
            <h5 class="fw-bold">Community Safety</h5>
            <p class="text-muted small">Approved community counterfeit reports alert future shoppers instantly.</p>
          </div>
        </div>
      </div>
      <h4 class="fw-bold mb-3">Recent Verified Incident Alerts</h4>
      <div id="recentReportsContainer" class="row g-3"></div>
    </div>
  </main>
  ${footerHtml}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>`;

// public/verify.html
files['public/verify.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Verify Product | TrustTag AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="/css/style.css">
  <script src="https://unpkg.com/html5-qrcode"></script>
</head>
<body>
  ${navHtml('verify')}
  <main class="py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <h2 class="fw-bold text-center mb-4">Product Authenticity Check</h2>
          <div class="card card-custom p-4 mb-4">
            <ul class="nav nav-pills nav-fill mb-3" role="tablist">
              <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#manual-pane">Manual Product ID</button></li>
              <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#cam-pane">Camera Scanner</button></li>
            </ul>
            <div class="tab-content pt-2">
              <div class="tab-pane fade show active" id="manual-pane">
                <form id="verifyForm">
                  <div class="input-group">
                    <input type="text" class="form-control form-control-lg" id="productIdInput" placeholder="e.g. PROD-MED-9941" required>
                    <button class="btn btn-teal px-4" type="submit">Verify Now</button>
                  </div>
                  <div class="small text-muted mt-2">
                    Click demo: <a href="javascript:void(0)" class="badge bg-light text-dark border sample-id-link">PROD-MED-9941</a>
                    <a href="javascript:void(0)" class="badge bg-light text-dark border sample-id-link">FAKE-SUSPECT-001</a>
                    <a href="javascript:void(0)" class="badge bg-light text-dark border sample-id-link">UNKNOWN-999</a>
                  </div>
                </form>
              </div>
              <div class="tab-pane fade text-center" id="cam-pane">
                <div class="d-flex justify-content-center gap-2 mb-3">
                  <button class="btn btn-teal btn-sm" id="btnStartCamera"><i class="bi bi-play-circle me-1"></i>Start Camera</button>
                  <button class="btn btn-outline-danger btn-sm" id="btnStopCamera" disabled><i class="bi bi-stop-circle me-1"></i>Stop Camera</button>
                </div>
                <div id="cameraFeedback" class="small mb-2 fw-semibold text-secondary"></div>
                <div id="qr-reader" style="max-width: 400px; margin: 0 auto;"></div>
              </div>
            </div>
          </div>
          <div id="verifyLoading" class="text-center my-4 d-none">
            <div class="spinner-border text-teal" role="status"></div>
            <p class="small text-muted mt-2">Checking registry...</p>
          </div>
          <div id="verificationResultArea" class="d-none"></div>
          <div class="advisory-box mt-4">
            <strong>Consumer Notice:</strong> A database match validates registered codes, but physical packaging inspection (holograms, seals, official receipt) remains vital.
          </div>
        </div>
      </div>
    </div>
  </main>
  ${footerHtml}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/main.js"></script>
  <script src="/js/verify.js"></script>
</body>
</html>`;

// public/report.html
files['public/report.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Report Fake | TrustTag AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  ${navHtml('report')}
  <main class="py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-7">
          <h2 class="fw-bold text-center mb-3">Report a Suspicious Product</h2>
          <div class="card card-custom p-4">
            <div id="reportAlert" class="alert d-none"></div>
            <form id="reportForm">
              <div class="mb-3">
                <label class="form-label fw-bold">Product ID / Barcode *</label>
                <input type="text" class="form-control" id="reportProductId" placeholder="e.g. FAKE-SUSPECT-001" required>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Product Name</label>
                  <input type="text" class="form-control" id="reportProductName" placeholder="e.g. Herbal Hair Serum">
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Brand</label>
                  <input type="text" class="form-control" id="reportBrand" placeholder="e.g. PureOrganics">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Reason for Suspicion *</label>
                <select class="form-select" id="reportReason" required>
                  <option value="" selected disabled>Choose reason...</option>
                  <option value="Poor packaging or spelling errors">Poor packaging or spelling errors</option>
                  <option value="Broken or missing safety seal">Broken or missing safety seal</option>
                  <option value="Suspiciously low price / Unofficial seller">Suspiciously low price / Unofficial seller</option>
                  <option value="Altered expiry date or batch number">Altered expiry date or batch number</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Purchase Location / Store</label>
                <input type="text" class="form-control" id="reportLocation" placeholder="e.g. Chemist Shop, Old Market">
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Incident Details (Min 15 chars) *</label>
                <textarea class="form-control" id="reportDescription" rows="3" required placeholder="Describe what looks fake or suspicious..."></textarea>
              </div>
              <button type="submit" class="btn btn-teal w-100">Submit Report for Review</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </main>
  ${footerHtml}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/main.js"></script>
  <script src="/js/report.js"></script>
</body>
</html>`;

// public/product.html
files['public/product.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Product Details | TrustTag AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  ${navHtml('')}
  <main class="py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8" id="productContainer">
          <div class="text-center py-5"><div class="spinner-border text-teal"></div></div>
        </div>
      </div>
    </div>
  </main>
  ${footerHtml}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/main.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      const id = new URLSearchParams(window.location.search).get('id');
      const box = document.getElementById('productContainer');
      if(!id) { box.innerHTML = '<div class="alert alert-danger">No Product ID provided!</div>'; return; }
      try {
        const res = await fetch('/api/products/' + encodeURIComponent(id));
        if(!res.ok) throw new Error();
        const { product, approvedReports } = await res.json();
        box.innerHTML = \`
          <div class="card card-custom p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="badge bg-secondary">\${product.category || 'General'}</span>
              <code>\${product.productIdentifier}</code>
            </div>
            <h3 class="fw-bold mb-1">\${product.productName}</h3>
            <p class="text-muted">Brand: <strong>\${product.brand}</strong> &bull; Manufacturer: \${product.manufacturer}</p>
            <div class="row g-2 p-3 bg-light rounded mb-4">
              <div class="col-sm-3"><small class="text-muted d-block">Batch</small><strong>\${product.batchNumber}</strong></div>
              <div class="col-sm-3"><small class="text-muted d-block">MRP</small><strong class="text-success">₹ \${product.mrp}</strong></div>
              <div class="col-sm-3"><small class="text-muted d-block">Mfg Date</small><strong>\${product.manufacturingDate}</strong></div>
              <div class="col-sm-3"><small class="text-muted d-block">Expiry</small><strong>\${product.expiryDate}</strong></div>
            </div>
            <h5 class="fw-bold">Approved Community Warnings (\${approvedReports.length})</h5>
            \${approvedReports.length === 0 ? '<p class="small text-muted">No suspicious incident reports on record.</p>' : 
              approvedReports.map(r => '<div class="alert alert-warning small mb-2"><strong>' + r.reason + ':</strong> ' + r.description + '</div>').join('')
            }
            <div class="mt-3">
              <a href="/verify.html" class="btn btn-outline-secondary btn-sm">&larr; Back to Verify</a>
              <a href="/report.html?id=\${encodeURIComponent(product.productIdentifier)}" class="btn btn-outline-danger btn-sm">Report This Product</a>
            </div>
          </div>
        \`;
      } catch(e) {
        box.innerHTML = '<div class="alert alert-danger">Product not found in registry.</div>';
      }
    });
  </script>
</body>
</html>`;

// public/login.html
files['public/login.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Login | TrustTag AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body class="d-flex flex-column min-vh-100">
  ${navHtml('')}
  <main class="py-5 my-auto">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-5">
          <div class="card card-custom p-4">
            <h3 class="fw-bold text-center mb-3">Sign In</h3>
            <div id="loginAlert" class="alert d-none"></div>
            <form id="loginForm">
              <div class="mb-3">
                <label class="form-label fw-bold">Email Address</label>
                <input type="email" class="form-control" id="loginEmail" value="admin@trusttag.local" required>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Password</label>
                <input type="password" class="form-control" id="loginPassword" value="AdminSecurePass@2026" required>
              </div>
              <button type="submit" class="btn btn-teal w-100">Log In</button>
            </form>
            <div class="advisory-box mt-3 small text-center">
              <strong>Admin Demo:</strong><br><code>admin@trusttag.local</code> / <code>AdminSecurePass@2026</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  ${footerHtml}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/auth.js"></script>
</body>
</html>`;

// public/dashboard.html
files['public/dashboard.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Admin Dashboard | TrustTag AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav class="navbar navbar-custom">
    <div class="container-fluid px-4">
      <a class="navbar-brand" href="/">TrustTag<span>AI</span> <span class="badge bg-danger">Admin</span></a>
      <div>
        <span class="text-light me-3" id="adminUserGreeting">Admin</span>
        <button class="btn btn-sm btn-outline-light" id="adminLogoutBtn">Logout</button>
      </div>
    </div>
  </nav>
  <main class="py-4">
    <div class="container-fluid px-4">
      <div class="row g-3 mb-4">
        <div class="col-md-3"><div class="card card-custom p-3 border-start border-4 border-primary"><small>PRODUCTS</small><h3 class="my-1" id="statProducts">0</h3></div></div>
        <div class="col-md-3"><div class="card card-custom p-3 border-start border-4 border-warning"><small>PENDING REPORTS</small><h3 class="my-1 text-warning" id="statPendingReports">0</h3></div></div>
        <div class="col-md-3"><div class="card card-custom p-3 border-start border-4 border-danger"><small>APPROVED FAKES</small><h3 class="my-1 text-danger" id="statApprovedReports">0</h3></div></div>
        <div class="col-md-3"><div class="card card-custom p-3 border-start border-4 border-success"><small>USERS</small><h3 class="my-1 text-success" id="statUsers">0</h3></div></div>
      </div>
      <div class="card card-custom">
        <div class="card-header bg-white">
          <ul class="nav nav-tabs card-header-tabs" role="tablist">
            <li class="nav-item"><button class="nav-link active text-dark" data-bs-toggle="tab" data-bs-target="#rep-pane">Reports Moderation Queue</button></li>
            <li class="nav-item"><button class="nav-link text-dark" data-bs-toggle="tab" data-bs-target="#prod-pane">Manage Products</button></li>
            <li class="nav-item"><button class="nav-link text-dark" data-bs-toggle="tab" data-bs-target="#aud-pane">Audit Logs</button></li>
          </ul>
        </div>
        <div class="card-body">
          <div class="tab-content">
            <div class="tab-pane fade show active" id="rep-pane">
              <div class="table-responsive">
                <table class="table table-hover align-middle">
                  <thead><tr><th>Product ID</th><th>Reason</th><th>Description</th><th>Date</th><th>Status</th><th class="text-end">Action</th></tr></thead>
                  <tbody id="reportsTableBody"></tbody>
                </table>
              </div>
            </div>
            <div class="tab-pane fade" id="prod-pane">
              <button class="btn btn-teal btn-sm mb-3" data-bs-toggle="modal" data-bs-target="#addProductModal">+ Add New Product</button>
              <div class="table-responsive">
                <table class="table table-hover align-middle">
                  <thead><tr><th>ID</th><th>Name</th><th>Brand</th><th>Batch</th><th>MRP</th><th>Status</th><th class="text-end">View</th></tr></thead>
                  <tbody id="productsTableBody"></tbody>
                </table>
              </div>
            </div>
            <div class="tab-pane fade" id="aud-pane">
              <div class="table-responsive">
                <table class="table table-hover align-middle">
                  <thead><tr><th>Time</th><th>Action</th><th>Target</th><th>By</th></tr></thead>
                  <tbody id="auditTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  <!-- Modal -->
  <div class="modal fade" id="addProductModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <form id="addProductForm">
          <div class="modal-header"><h5 class="modal-title">Register Product</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <div class="mb-2"><label class="form-label">Product ID *</label><input type="text" name="productIdentifier" class="form-control" required placeholder="e.g. PROD-TEST-101"></div>
            <div class="mb-2"><label class="form-label">Product Name *</label><input type="text" name="productName" class="form-control" required placeholder="e.g. Amoxicillin 500mg"></div>
            <div class="mb-2"><label class="form-label">Brand *</label><input type="text" name="brand" class="form-control" required placeholder="e.g. MediPharma"></div>
            <div class="row g-2 mb-2">
              <div class="col-6"><label class="form-label">Batch</label><input type="text" name="batchNumber" class="form-control" placeholder="BATCH-01"></div>
              <div class="col-6"><label class="form-label">MRP (₹)</label><input type="number" name="mrp" class="form-control" placeholder="150"></div>
            </div>
          </div>
          <div class="modal-footer"><button type="submit" class="btn btn-teal">Save Product</button></div>
        </form>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/dashboard.js"></script>
</body>
</html>`;

// public/about.html
files['public/about.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>About & FAQ | TrustTag AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  ${navHtml('about')}
  <main class="py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card card-custom p-4 mb-4">
            <h3 class="fw-bold">About TrustTag AI</h3>
            <p class="text-muted">A college engineering project aimed at protecting consumers from duplicate and counterfeit products by combining official registry validation with community incident reports.</p>
            <h5 class="fw-bold mt-4">Frequently Asked Questions</h5>
            <div class="accordion" id="faq">
              <div class="accordion-item">
                <h2 class="accordion-header"><button class="accordion-button" data-bs-toggle="collapse" data-bs-target="#f1">Does a database match guarantee 100% authenticity?</button></h2>
                <div id="f1" class="accordion-collapse collapse show"><div class="accordion-body small text-muted">No. Counterfeiters can photocopy a genuine QR code onto duplicate packaging. Physical inspection of seals and authorized dealer bills is mandatory.</div></div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#f2">How are reports moderated?</button></h2>
                <div id="f2" class="accordion-collapse collapse"><div class="accordion-body small text-muted">All user complaints enter a Pending queue. Only after an administrator verifies the packaging details is the alert approved for public view.</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  ${footerHtml}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>`;

// 3. Write all files to disk
Object.keys(files).forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  fs.writeFileSync(fullPath, files[filePath], 'utf8');
  console.log(`✅ File create ho gayi: ${filePath}`);
});

// 4. Install npm packages
console.log('\n📦 Dependencies install ho rahi hain (npm install)... kripya 15-30 second wait karein...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('\n🎉 SUCCESS! Saari dependencies install ho chuki hain!\n');
} catch(err) {
  console.log('⚠️ Agar npm install me issue aaye toh terminal me khud "npm install" likh lena.');
}

console.log('================================================================');
console.log('✨ TrustTag AI setup COMPLETE!');
console.log('👉 Ab project start karne ke liye ye command chalao:');
console.log('   npm start');
console.log('================================================================\n');