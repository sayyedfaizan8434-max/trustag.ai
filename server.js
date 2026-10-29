const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = 'trusttag_super_secure_jwt_secret_key_2026';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. AUTO-GENERATE PUBLIC FOLDER & ALL HTML FILES IF MISSING
const PUBLIC_DIR = path.join(__dirname, 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Global Nav & Footer
const navHtml = `
<nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow">
  <div class="container">
    <a class="navbar-brand fw-bold text-info" href="/"><i class="bi bi-shield-check me-2"></i>TrustTag AI</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu"><span class="navbar-toggler-icon"></span></button>
    <div class="collapse navbar-collapse" id="navMenu">
      <ul class="navbar-nav ms-auto align-items-center">
        <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="/verify.html">Verify Product</a></li>
        <li class="nav-item"><a class="nav-link" href="/report.html">Report Fake</a></li>
        <li class="nav-item ms-lg-3" id="navAuthSlot">
          <a class="btn btn-sm btn-outline-info me-2" href="/login.html">Login</a>
          <a class="btn btn-sm btn-info text-dark fw-bold" href="/register.html">Register</a>
        </li>
      </ul>
    </div>
  </div>
</nav>`;

const footerHtml = `
<footer class="bg-dark text-secondary text-center py-4 mt-auto border-top border-secondary">
  <div class="container small">
    &copy; 2026 TrustTag AI — Smart Product Authenticity System. 24/7 Live Cloud Edition.
  </div>
</footer>`;

// Pages Definition
const pages = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>TrustTag AI | Home</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <style>
    body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
    .hero { background: linear-gradient(135deg, #0a192f 0%, #1e293b 100%); padding: 4rem 0; border-bottom: 1px solid #334155; }
    .card-dark { background: #1e293b; border: 1px solid #334155; border-radius: 12px; }
  </style>
</head>
<body>
  ${navHtml}
  <div class="hero">
    <div class="container">
      <div class="row align-items-center g-4">
        <div class="col-lg-7">
          <span class="badge bg-info text-dark mb-2">Live Cloud Protection Active</span>
          <h1 class="display-4 fw-bold mb-3">Verify Genuine Products. Stop Counterfeits.</h1>
          <p class="lead text-secondary mb-4">Protect yourself from duplicate products. Scan barcodes or check registry records instantly.</p>
          <div class="d-flex gap-3">
            <a href="/verify.html" class="btn btn-info btn-lg text-dark fw-bold"><i class="bi bi-qr-code-scan me-2"></i>Verify Product</a>
            <a href="/report.html" class="btn btn-outline-light btn-lg"><i class="bi bi-flag me-2"></i>Report Fake</a>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="card card-dark p-4 shadow-lg">
            <h5 class="fw-bold mb-2">Quick Test Barcodes</h5>
            <p class="small text-secondary mb-3">Click any real product below to test:</p>
            <div class="d-grid gap-2">
              <a href="/verify.html?id=8901058852441" class="btn btn-outline-info text-start small">🍜 Maggi 2-Min Noodles (8901058852441)</a>
              <a href="/verify.html?id=8901117002016" class="btn btn-outline-info text-start small">💊 Dolo-650 Tablets (8901117002016)</a>
              <a href="/verify.html?id=FAKE-COSMETIC-001" class="btn btn-outline-danger text-start small">⚠️ Luxury Glow Serum (Fake Warning Demo)</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <main class="container my-5">
    <h3 class="fw-bold mb-4 text-center">Verified Community Counterfeit Alerts</h3>
    <div id="reportsFeed" class="row g-3">
      <div class="col-12 text-center text-secondary py-3"><div class="spinner-border spinner-border-sm text-info me-2"></div>Loading live alerts...</div>
    </div>
  </main>
  ${footerHtml}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    fetch('/api/reports/recent-public').then(r => r.json()).then(d => {
      const box = document.getElementById('reportsFeed');
      if(!d.reports || d.reports.length === 0) { box.innerHTML = '<div class="col-12 text-center text-secondary">No active reports.</div>'; return; }
      box.innerHTML = d.reports.map(r => \`
        <div class="col-md-4">
          <div class="card card-dark p-3 h-100 border-danger">
            <span class="badge bg-danger mb-2">Counterfeit Alert</span>
            <h6 class="fw-bold mb-1">\${r.reportedIdentifier}</h6>
            <p class="text-warning small mb-1"><strong>Reason:</strong> \${r.reason}</p>
            <p class="small text-secondary mb-0">\${r.description}</p>
          </div>
        </div>
      \`).join('');
    });
    // Auth Check
    const u = JSON.parse(localStorage.getItem('trusttag_user') || 'null');
    if(u) {
      document.getElementById('navAuthSlot').innerHTML = \`
        <span class="badge bg-secondary me-2">👤 \${u.name}</span>
        <button class="btn btn-sm btn-outline-danger" onclick="localStorage.clear(); location.reload();">Logout</button>
      \`;
    }
  </script>
</body>
</html>`,

  'verify.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Verify Product | TrustTag AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <script src="https://unpkg.com/html5-qrcode"></script>
  <style>
    body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
    .card-dark { background: #1e293b; border: 1px solid #334155; border-radius: 12px; }
  </style>
</head>
<body>
  ${navHtml}
  <main class="container my-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <h2 class="fw-bold text-center mb-4"><i class="bi bi-patch-check text-info me-2"></i>Product Authenticity Check</h2>
        <div class="card card-dark p-4 mb-4">
          <form id="verifyForm" class="mb-3">
            <label class="form-label fw-bold">Enter Product Barcode / ID</label>
            <div class="input-group">
              <input type="text" id="barcodeInput" class="form-control form-control-lg" placeholder="e.g. 8901058852441" required>
              <button class="btn btn-info fw-bold px-4 text-dark" type="submit">Verify Now</button>
            </div>
          </form>
          <div class="text-center py-2 border-top border-secondary mt-3">
            <button class="btn btn-outline-info btn-sm me-2" id="startCamBtn"><i class="bi bi-camera me-1"></i>Start Camera Scanner</button>
            <button class="btn btn-outline-danger btn-sm" id="stopCamBtn" disabled><i class="bi bi-stop-circle me-1"></i>Stop Camera</button>
          </div>
          <div id="camMsg" class="small text-secondary text-center my-2"></div>
          <div id="qr-reader" style="max-width: 400px; margin: 0 auto;"></div>
        </div>
        <div id="resultBox"></div>
      </div>
    </div>
  </main>
  ${footerHtml}
  <script>
    let scanner = null;
    const form = document.getElementById('verifyForm');
    const input = document.getElementById('barcodeInput');
    const resultBox = document.getElementById('resultBox');
    const camMsg = document.getElementById('camMsg');

    const checkId = async (id) => {
      resultBox.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-info"></div></div>';
      const res = await fetch('/api/verify-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id })
      });
      const d = await res.json();
      if(d.outcome === 'VERIFIED_RECORD_FOUND') {
        resultBox.innerHTML = \`
          <div class="card card-dark p-4 border-success">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-success">VERIFIED IN REGISTRY</span>
              <code>\${d.product.productIdentifier}</code>
            </div>
            <h3 class="fw-bold mb-1">\${d.product.productName}</h3>
            <p class="text-secondary">Brand: <strong>\${d.product.brand}</strong> &bull; Manufacturer: \${d.product.manufacturer}</p>
            <div class="row g-2 p-3 bg-dark rounded mb-3">
              <div class="col-6 col-md-3"><small class="text-secondary d-block">Batch</small><strong>\${d.product.batchNumber}</strong></div>
              <div class="col-6 col-md-3"><small class="text-secondary d-block">Official MRP</small><strong class="text-success">₹ \${d.product.mrp}</strong></div>
              <div class="col-6 col-md-3"><small class="text-secondary d-block">Mfg Date</small><strong>\${d.product.manufacturingDate}</strong></div>
              <div class="col-6 col-md-3"><small class="text-secondary d-block">Expiry</small><strong>\${d.product.expiryDate}</strong></div>
            </div>
            <small class="text-info"><i class="bi bi-database me-1"></i> Verified via: \${d.product.verificationSource}</small>
          </div>
        \`;
      } else if(d.outcome === 'WARNING_APPROVED_REPORTS_EXIST') {
        resultBox.innerHTML = \`
          <div class="card card-dark p-4 border-warning">
            <span class="badge bg-warning text-dark mb-2">WARNING: SUSPICIOUS COUNTERFEIT ALERT</span>
            <h4 class="fw-bold">\${d.product.productName}</h4>
            <div class="alert alert-warning my-2 small">
              <strong>Caution:</strong> \${d.approvedReports.map(r => r.reason + ': ' + r.description).join('<br>')}
            </div>
            <a href="/report.html?id=\${encodeURIComponent(d.product.productIdentifier)}" class="btn btn-sm btn-outline-danger">Report More Evidence</a>
          </div>
        \`;
      } else {
        resultBox.innerHTML = \`
          <div class="card card-dark p-4 border-danger">
            <span class="badge bg-danger mb-2">NOT FOUND IN REGISTRY</span>
            <h5 class="fw-bold">No Authorized Record Found</h5>
            <p class="small text-secondary">This barcode was not found in the verified database. If you suspect fraud, report it.</p>
            <a href="/report.html?id=\${encodeURIComponent(id)}" class="btn btn-danger btn-sm">Report Suspicious Item</a>
          </div>
        \`;
      }
    };

    form.onsubmit = (e) => { e.preventDefault(); checkId(input.value.trim()); };

    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('id')) { input.value = urlParams.get('id'); checkId(urlParams.get('id')); }

    document.getElementById('startCamBtn').onclick = async () => {
      try {
        if(!scanner) scanner = new Html5Qrcode('qr-reader');
        camMsg.textContent = 'Camera starting...';
        await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, (decoded) => {
          camMsg.textContent = 'Scanned: ' + decoded;
          scanner.stop();
          document.getElementById('startCamBtn').disabled = false;
          document.getElementById('stopCamBtn').disabled = true;
          input.value = decoded;
          checkId(decoded);
        }, () => {});
        document.getElementById('startCamBtn').disabled = true;
        document.getElementById('stopCamBtn').disabled = false;
        camMsg.textContent = 'Hold Barcode or QR Code in front of camera.';
      } catch(err) { camMsg.textContent = 'Camera error: ' + err.message; }
    };

    document.getElementById('stopCamBtn').onclick = async () => {
      if(scanner) await scanner.stop();
      document.getElementById('startCamBtn').disabled = false;
      document.getElementById('stopCamBtn').disabled = true;
      camMsg.textContent = 'Camera stopped.';
    };
  </script>
</body>
</html>`,

  'login.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Login | TrustTag AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <style>
    body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
    .card-dark { background: #1e293b; border: 1px solid #334155; border-radius: 12px; }
  </style>
</head>
<body class="my-auto">
  ${navHtml}
  <main class="container my-5">
    <div class="row justify-content-center">
      <div class="col-md-5">
        <div class="card card-dark p-4 shadow-lg">
          <h3 class="fw-bold text-center mb-3">Sign In</h3>
          <div id="loginMsg" class="alert d-none"></div>
          <form id="loginForm">
            <div class="mb-3">
              <label class="form-label">Gmail / Email Address</label>
              <input type="email" class="form-control bg-dark text-light border-secondary" id="loginEmail" placeholder="name@gmail.com" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Password</label>
              <input type="password" class="form-control bg-dark text-light border-secondary" id="loginPass" placeholder="••••••••" required>
            </div>
            <button class="btn btn-info text-dark fw-bold w-100 py-2" type="submit">Log In</button>
          </form>
          <div class="text-center mt-3 small text-secondary">
            Don't have an account? <a href="/register.html" class="text-info fw-bold">Register</a>
          </div>
          <div class="p-2 bg-dark rounded small text-secondary mt-3 border border-secondary text-center">
            <strong>Admin Login:</strong><br><code>admin@trusttag.local</code> / <code>AdminRealPass@2026</code>
          </div>
        </div>
      </div>
    </div>
  </main>
  ${footerHtml}
  <script>
    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const msg = document.getElementById('loginMsg');
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPass').value })
        });
        const d = await res.json();
        if(!res.ok) throw new Error(d.message);
        localStorage.setItem('trusttag_token', d.token);
        localStorage.setItem('trusttag_user', JSON.stringify(d.user));
        msg.className = 'alert alert-success'; msg.textContent = 'Login successful! Redirecting...'; msg.classList.remove('d-none');
        setTimeout(() => { location.href = '/'; }, 800);
      } catch(err) {
        msg.className = 'alert alert-danger'; msg.textContent = err.message; msg.classList.remove('d-none');
      }
    };
  </script>
</body>
</html>`,

  'register.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Register | TrustTag AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <style>
    body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
    .card-dark { background: #1e293b; border: 1px solid #334155; border-radius: 12px; }
  </style>
</head>
<body class="my-auto">
  ${navHtml}
  <main class="container my-5">
    <div class="row justify-content-center">
      <div class="col-md-5">
        <div class="card card-dark p-4 shadow-lg">
          <h3 class="fw-bold text-center mb-1">Create Account</h3>
          <p class="small text-secondary text-center mb-3">Register with any Gmail & your custom password</p>
          <div id="regMsg" class="alert d-none"></div>
          <form id="regForm">
            <div class="mb-2">
              <label class="form-label">Your Name</label>
              <input type="text" class="form-control bg-dark text-light border-secondary" id="regName" placeholder="e.g. Rahul Sharma" required>
            </div>
            <div class="mb-2">
              <label class="form-label">Gmail / Email Address</label>
              <input type="email" class="form-control bg-dark text-light border-secondary" id="regEmail" placeholder="e.g. rahul@gmail.com" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Set Your Custom Password</label>
              <input type="password" class="form-control bg-dark text-light border-secondary" id="regPass" placeholder="••••••••" required minlength="4">
            </div>
            <button class="btn btn-info text-dark fw-bold w-100 py-2" type="submit">Create Real Account</button>
          </form>
          <div class="text-center mt-3 small text-secondary">
            Already have an account? <a href="/login.html" class="text-info fw-bold">Log in</a>
          </div>
        </div>
      </div>
    </div>
  </main>
  ${footerHtml}
  <script>
    document.getElementById('regForm').onsubmit = async (e) => {
      e.preventDefault();
      const msg = document.getElementById('regMsg');
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: document.getElementById('regName').value, email: document.getElementById('regEmail').value, password: document.getElementById('regPass').value })
        });
        const d = await res.json();
        if(!res.ok) throw new Error(d.message);
        localStorage.setItem('trusttag_token', d.token);
        localStorage.setItem('trusttag_user', JSON.stringify(d.user));
        msg.className = 'alert alert-success'; msg.textContent = 'Account created! Redirecting...'; msg.classList.remove('d-none');
        setTimeout(() => { location.href = '/'; }, 800);
      } catch(err) {
        msg.className = 'alert alert-danger'; msg.textContent = err.message; msg.classList.remove('d-none');
      }
    };
  </script>
</body>
</html>`,

  'report.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Report Fake | TrustTag AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <style>
    body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
    .card-dark { background: #1e293b; border: 1px solid #334155; border-radius: 12px; }
  </style>
</head>
<body>
  ${navHtml}
  <main class="container my-5">
    <div class="row justify-content-center">
      <div class="col-lg-6">
        <div class="card card-dark p-4 shadow-lg">
          <h3 class="fw-bold text-center mb-3"><i class="bi bi-flag-fill text-danger me-2"></i>Report Suspicious Product</h3>
          <div id="repMsg" class="alert d-none"></div>
          <form id="repForm">
            <div class="mb-3">
              <label class="form-label">Product Barcode / ID *</label>
              <input type="text" class="form-control bg-dark text-light border-secondary" id="repId" placeholder="e.g. 8901058852441" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Reason *</label>
              <select class="form-select bg-dark text-light border-secondary" id="repReason" required>
                <option value="Poor packaging or spelling errors">Poor packaging or spelling errors</option>
                <option value="Broken safety seal">Broken safety seal</option>
                <option value="Suspiciously low price">Suspiciously low price</option>
                <option value="Altered expiry date">Altered expiry date</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Description *</label>
              <textarea class="form-control bg-dark text-light border-secondary" id="repDesc" rows="3" required placeholder="Describe what looks fake..."></textarea>
            </div>
            <button class="btn btn-danger w-100 py-2 fw-bold" type="submit">Submit Fake Report</button>
          </form>
        </div>
      </div>
    </div>
  </main>
  ${footerHtml}
  <script>
    const idParam = new URLSearchParams(window.location.search).get('id');
    if(idParam) document.getElementById('repId').value = idParam;
    document.getElementById('repForm').onsubmit = async (e) => {
      e.preventDefault();
      const msg = document.getElementById('repMsg');
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedIdentifier: document.getElementById('repId').value.trim(),
          reason: document.getElementById('repReason').value,
          description: document.getElementById('repDesc').value.trim()
        })
      });
      msg.className = 'alert alert-success'; msg.textContent = 'Report submitted successfully! Queued for review.'; msg.classList.remove('d-none');
      e.target.reset();
    };
  </script>
</body>
</html>`
};

// Write all HTML files into public directory automatically!
Object.keys(pages).forEach(filename => {
  const filePath = path.join(PUBLIC_DIR, filename);
  fs.writeFileSync(filePath, pages[filename], 'utf8');
});
console.log('✅ All Frontend HTML Files Auto-Generated in:', PUBLIC_DIR);

app.use(express.static(PUBLIC_DIR));

// Direct Route Handlers (ENOENT Proof: It will NEVER throw Cannot GET /)
app.get('/', (req, res) => res.send(pages['index.html']));
app.get('/verify.html', (req, res) => res.send(pages['verify.html']));
app.get('/login.html', (req, res) => res.send(pages['login.html']));
app.get('/register.html', (req, res) => res.send(pages['register.html']));
app.get('/report.html', (req, res) => res.send(pages['report.html']));

// 2. IN-MEMORY / PERSISTENT DATABASE ENGINE
let db = {
  users: [
    {
      id: "usr_admin",
      name: "System Admin",
      email: "admin@trusttag.local",
      passwordHash: bcrypt.hashSync("AdminRealPass@2026", 10),
      role: "admin"
    }
  ],
  products: [
    {
      productIdentifier: "8901058852441",
      productName: "Maggi 2-Minute Masala Instant Noodles (70g)",
      brand: "Nestlé India",
      category: "Packaged Food",
      manufacturer: "Nestlé India Limited",
      batchNumber: "MAG-2026-IN09",
      manufacturingDate: "2026-01-10",
      expiryDate: "2026-10-10",
      mrp: 14.00,
      verificationSource: "GS1 India Master Registry",
      verificationStatus: "Active"
    },
    {
      productIdentifier: "8901117002016",
      productName: "Dolo-650 Paracetamol IP Tablets (Strip of 15)",
      brand: "Micro Labs Ltd",
      category: "Pharmaceuticals",
      manufacturer: "Micro Labs Limited",
      batchNumber: "DOLO-650-B441",
      manufacturingDate: "2025-08-15",
      expiryDate: "2028-07-31",
      mrp: 34.00,
      verificationSource: "CDSCO Central Drug Registry",
      verificationStatus: "Active"
    },
    {
      productIdentifier: "FAKE-COSMETIC-001",
      productName: "Luxury Glow Vitamin C Face Serum (30ml)",
      brand: "DermaBright Organics",
      category: "Cosmetics",
      manufacturer: "Substandard Bottler",
      batchNumber: "FAKE-LOT-007",
      manufacturingDate: "2024-05-10",
      expiryDate: "2026-05-09",
      mrp: 899.00,
      verificationSource: "Consumer Division",
      verificationStatus: "Active"
    }
  ],
  reports: [
    {
      id: "rep_1",
      reportedIdentifier: "FAKE-COSMETIC-001",
      productName: "Luxury Glow Vitamin C Face Serum (30ml)",
      brand: "DermaBright Organics",
      reason: "Poor packaging or spelling errors",
      location: "Chandni Chowk Market, Delhi",
      description: "Packaging misspells 'Dermatologist' as 'Dermatlogist'. Cap seal broken.",
      status: "approved",
      createdAt: new Date().toISOString()
    }
  ]
};

// ================= APIS =================

// Register
app.post('/api/auth/register', (req, res) => {
  let { name, email, password } = req.body;
  name = (name || 'Consumer').trim();
  email = (email || '').toLowerCase().trim();
  password = (password || '').trim();

  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already registered. Please login.' });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'user'
  };
  db.users.push(newUser);

  const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '15d' });
  res.status(201).json({ message: 'Registration s
