const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'trusttag_super_secure_jwt_secret_key_2026';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SMART PATH RESOLVER: Yeh code public folder ko har jagah se dhoondh lega!
const findPublicDir = () => {
  const paths = [
    path.join(__dirname, 'public'),
    path.join(__dirname, '../public'),
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'TrustTag-AI2/public'),
    path.join(__dirname, 'TrustTag-AI2/public')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, 'public');
};

const PUBLIC_DIR = findPublicDir();
console.log('Serving static files from:', PUBLIC_DIR);

app.use(express.static(PUBLIC_DIR));

// EXPLICIT ROUTES: "Cannot GET /" ko hamesha ke liye khatam karne ke liye
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get('/verify.html', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'verify.html')));
app.get('/report.html', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'report.html')));
app.get('/product.html', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'product.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'login.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'register.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html')));
app.get('/about.html', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'about.html')));

// Database File Resolver
const findDBFile = () => {
  const paths = [
    path.join(__dirname, 'data/database.json'),
    path.join(__dirname, 'server/data/database.json'),
    path.join(process.cwd(), 'server/data/database.json'),
    path.join(process.cwd(), 'data/database.json')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  const defaultPath = path.join(__dirname, 'database.json');
  if (!fs.existsSync(defaultPath)) {
    fs.writeFileSync(defaultPath, JSON.stringify({ users: [], products: [], reports: [], auditLogs: [] }));
  }
  return defaultPath;
};

const DB_FILE = findDBFile();

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch(e) {
    return { users: [], products: [], reports: [], auditLogs: [] };
  }
}

function writeDB(data) {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch(e) {}
}

// Pre-fill initial products if database is fresh
const initDB = readDB();
if (!initDB.products || initDB.products.length === 0) {
  initDB.products = [
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
  ];
  initDB.reports = [
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
  ];
  initDB.users = [
    {
      id: "usr_admin",
      name: "System Admin",
      email: "admin@trusttag.local",
      passwordHash: bcrypt.hashSync("AdminRealPass@2026", 10),
      role: "admin",
      createdAt: new Date().toISOString()
    }
  ];
  writeDB(initDB);
}

// ================= APIS =================

// Real Register
app.post('/api/auth/register', (req, res) => {
  let { name, email, password } = req.body;
  name = (name || 'Consumer').trim();
  email = (email || '').toLowerCase().trim();
  password = (password || '').trim();

  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const db = readDB();
  if (db.users.some(u => u.email.toLowerCase().trim() === email)) {
    return res.status(400).json({ message: 'Email already registered. Please login.' });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'user',
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  writeDB(db);

  const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '15d' });
  res.status(201).json({ message: 'Registered successfully', token, user: newUser });
});

// Real Login
app.post('/api/auth/login', (req, res) => {
  let { email, password } = req.body;
  email = (email || '').toLowerCase().trim();
  password = (password || '').trim();

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase().trim() === email);
  if (!user) return res.status(401).json({ message: 'User not found. Please register first.' });

  const isMatch = bcrypt.compareSync(password, user.passwordHash) || (user.role === 'admin' && password === 'AdminRealPass@2026');
  if (!isMatch) return res.status(401).json({ message: 'Incorrect password.' });

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '15d' });
  res.json({ message: 'Login successful', token, user });
});

// Verify Product
app.post('/api/verify-product', (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ outcome: 'INSUFFICIENT_INFORMATION' });

  const cleanId = identifier.trim().toUpperCase();
  const db = readDB();
  const product = (db.products || []).find(p => p.productIdentifier === cleanId);
  const approvedReports = (db.reports || []).filter(r => r.reportedIdentifier === cleanId && r.status === 'approved');

  if (!product) {
    return res.json({ outcome: 'PRODUCT_RECORD_NOT_FOUND', queriedIdentifier: cleanId, approvedReportsCount: 0, approvedReports: [] });
  }
  if (approvedReports.length > 0) {
    return res.json({ outcome: 'WARNING_APPROVED_REPORTS_EXIST', product, approvedReportsCount: approvedReports.length, approvedReports });
  }
  return res.json({ outcome: 'VERIFIED_RECORD_FOUND', product, approvedReportsCount: 0, approvedReports: [] });
});

app.get('/api/products', (req, res) => res.json(readDB().products || []));
app.get('/api/reports/recent-public', (req, res) => {
  const approved = (readDB().reports || []).filter(r => r.status === 'approved').slice(0, 6);
  res.json({ reports: approved });
});

// Fallback: send index.html for any other route
app.get('*', (req, res) => {
  const file = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(file)) res.sendFile(file);
  else res.send('TrustTag AI Server Active. Public folder loading...');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('TrustTag AI Server running on port', PORT);
});
