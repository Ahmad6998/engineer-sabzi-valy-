import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PRODUCTS_FILE = path.join(__dirname, 'src', 'data', 'products.json');

// In-memory / persistent state
let products = [];
try {
  const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
  products = JSON.parse(data);
} catch (err) {
  console.error('Error loading products.json:', err);
}

let orders = [
  {
    id: "ESV-1001",
    customerName: "Hassan Tariq",
    phone: "0300-1234567",
    area: "Gulshan-e-Iqbal, Block 4",
    slot: "Morning (08:00 AM - 11:00 AM)",
    paymentMethod: "Cash on Delivery (COD)",
    status: "dispatched",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    items: [
      { id: "prod-1", name: "Aloo (Potato)", weightLabel: "2 kg", factor: 2.0, qty: 1, unitPrice: 180, orderedKg: 2.0, actualKg: 2.04, adjustedPrice: 183.6 },
      { id: "prod-2", name: "Pyaz (Red Onion)", weightLabel: "1 kg", factor: 1.0, qty: 2, unitPrice: 120, orderedKg: 2.0, actualKg: 1.95, adjustedPrice: 234.0 }
    ],
    originalTotal: 420,
    adjustedTotal: 417.6,
    rider: "Rider Ali (Bike # KHI-789)"
  },
  {
    id: "ESV-1002",
    customerName: "Ayesha Khan",
    phone: "0321-9876543",
    area: "DHA Phase 6",
    slot: "Mid-Day (12:00 PM - 03:00 PM)",
    paymentMethod: "JazzCash",
    status: "packing",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { id: "prod-3", name: "Tamatar (Fresh Tomato)", weightLabel: "1 kg", factor: 1.0, qty: 1, unitPrice: 140, orderedKg: 1.0, actualKg: 1.0, adjustedPrice: 140 },
      { id: "prod-4", name: "Adrak (Ginger)", weightLabel: "250g", factor: 0.25, qty: 1, unitPrice: 145, orderedKg: 0.25, actualKg: 0.25, adjustedPrice: 145 },
      { id: "prod-7", name: "Palak (Fresh Spinach)", weightLabel: "2 Bundles", factor: 2.0, qty: 1, unitPrice: 120, orderedKg: 0.6, actualKg: 0.6, adjustedPrice: 120 }
    ],
    originalTotal: 405,
    adjustedTotal: 405,
    rider: "Unassigned"
  }
];

let wastageLogs = [
  { id: "WST-1", date: new Date().toISOString().split('T')[0], vegetable: "Tamatar (Tomato)", initialArrivalKg: 150, gradeA_Kg: 130, gradeB_Kg: 14, gradeC_WastageKg: 6, reason: "Over-ripe / transport squeeze" }
];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // --- API ROUTES ---
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const { username, password } = await parseBody(req);
      const validUser = (username === 'admin' || username === 'admin@esv.pk' || username === 'ahmad');
      const validPass = (password === 'admin123' || password === 'esv2026' || password === 'admin');

      if (validUser && validPass) {
        return sendJson(res, 200, {
          success: true,
          token: `esv-auth-${Date.now()}`,
          admin: {
            name: "Muhammad Ahmad",
            username: username,
            role: "Super Admin & Procurement Lead",
            hub: "Karachi Central Mandi Station"
          }
        });
      } else {
        return sendJson(res, 401, {
          success: false,
          error: "Invalid username or password. (Default demo: admin / admin123)"
        });
      }
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/products' && req.method === 'GET') {
    return sendJson(res, 200, { success: true, products });
  }

  if (pathname === '/api/products/add' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      let imageUrl = data.image || "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80";

      // If user uploaded image from laptop as Base64 data:
      if (data.imageBase64) {
        const matches = data.imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const rawExt = matches[1].toLowerCase();
          const ext = rawExt.includes('png') ? 'png' : rawExt.includes('webp') ? 'webp' : 'jpg';
          const buffer = Buffer.from(matches[2], 'base64');
          const cleanName = (data.name || 'produce').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25);
          const filename = `${cleanName}-${Date.now()}.${ext}`;
          const targetDir = path.join(__dirname, 'public', 'assets', 'products');
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          const targetPath = path.join(targetDir, filename);
          fs.writeFileSync(targetPath, buffer);
          imageUrl = `/public/assets/products/${filename}`;
        }
      }

      // Configure portion weights based on unit
      let weights = [];
      const unit = data.unit || 'kg';
      if (unit === 'kg') {
        weights = [
          { label: "500g", factor: 0.5 },
          { label: "1 kg", factor: 1.0 },
          { label: "2 kg", factor: 2.0 },
          { label: "5 kg", factor: 4.8 }
        ];
      } else if (unit === 'bundle') {
        weights = [
          { label: "1 Bundle", factor: 1.0 },
          { label: "2 Bundles", factor: 2.0 },
          { label: "3 Bundles", factor: 2.8 }
        ];
      } else if (unit === 'dozen') {
        weights = [
          { label: "1 Dozen", factor: 1.0 },
          { label: "2 Dozens", factor: 1.9 }
        ];
      } else {
        weights = [
          { label: "1 Pack", factor: 1.0 },
          { label: "2 Packs", factor: 1.9 }
        ];
      }

      const newProduct = {
        id: `prod-${Date.now()}`,
        name: data.name || "New Produce",
        urduName: data.urduName || "",
        category: data.category || "vegetables",
        basePrice: Number(data.basePrice) || 100,
        unit: unit,
        mandiCost: Number(data.mandiCost) || Math.round((Number(data.basePrice) || 100) * 0.75),
        image: imageUrl,
        badge: data.badge || "Farm Fresh Today",
        description: data.description || "Farm fresh directly sourced from morning mandi.",
        weights: weights,
        stockKg: Number(data.stockKg) || 100,
        grade: data.grade || "Grade A"
      };

      products.unshift(newProduct);
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
      return sendJson(res, 201, { success: true, message: "Product added successfully!", product: newProduct, products });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/products/delete' && req.method === 'POST') {
    try {
      const { id } = await parseBody(req);
      products = products.filter(p => p.id !== id);
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
      return sendJson(res, 200, { success: true, message: "Product deleted", products });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/products/update' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const item = products.find(p => p.id === data.id);
      if (!item) return sendJson(res, 404, { success: false, error: "Product not found" });

      if (data.name !== undefined) item.name = data.name.trim();
      if (data.urduName !== undefined) item.urduName = data.urduName.trim();
      if (data.category !== undefined) item.category = data.category;
      if (data.mandiCost !== undefined) item.mandiCost = Number(data.mandiCost);
      if (data.basePrice !== undefined) item.basePrice = Number(data.basePrice);
      if (data.stockKg !== undefined) item.stockKg = Number(data.stockKg);
      if (data.unit !== undefined) {
        item.unit = data.unit;
        if (data.unit === 'kg') {
          item.weights = [
            { label: "500g", factor: 0.5 },
            { label: "1 kg", factor: 1.0 },
            { label: "2 kg", factor: 2.0 },
            { label: "5 kg", factor: 4.8 }
          ];
        } else if (data.unit === 'bundle') {
          item.weights = [
            { label: "1 Bundle", factor: 1.0 },
            { label: "2 Bundles", factor: 2.0 },
            { label: "3 Bundles", factor: 2.8 }
          ];
        } else if (data.unit === 'dozen') {
          item.weights = [
            { label: "1 Dozen", factor: 1.0 },
            { label: "2 Dozens", factor: 1.9 }
          ];
        } else {
          item.weights = [
            { label: "1 Pack", factor: 1.0 },
            { label: "2 Packs", factor: 1.9 }
          ];
        }
      }
      if (data.grade !== undefined) item.grade = data.grade;
      if (data.badge !== undefined) item.badge = data.badge;
      if (data.description !== undefined) item.description = data.description;
      if (data.status !== undefined) item.status = data.status;

      // If user uploaded a new image from laptop for this product:
      if (data.imageBase64) {
        const matches = data.imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const rawExt = matches[1].toLowerCase();
          const ext = rawExt.includes('png') ? 'png' : rawExt.includes('webp') ? 'webp' : 'jpg';
          const buffer = Buffer.from(matches[2], 'base64');
          const cleanName = (item.name || 'produce').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25);
          const filename = `${cleanName}-${Date.now()}.${ext}`;
          const targetDir = path.join(__dirname, 'public', 'assets', 'products');
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          const targetPath = path.join(targetDir, filename);
          fs.writeFileSync(targetPath, buffer);
          item.image = `/public/assets/products/${filename}`;
        }
      } else if (data.image) {
        item.image = data.image;
      }

      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
      return sendJson(res, 200, { success: true, message: "Product updated successfully!", product: item, products });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/mandi-rates/update' && req.method === 'POST') {
    try {
      const updates = await parseBody(req); // array of { id, name, urduName, mandiCost, basePrice, stockKg, status, grade, badge }
      updates.forEach(up => {
        const item = products.find(p => p.id === up.id);
        if (item) {
          if (up.name !== undefined && up.name.trim()) item.name = up.name.trim();
          if (up.urduName !== undefined) item.urduName = up.urduName.trim();
          if (up.mandiCost !== undefined) item.mandiCost = Number(up.mandiCost);
          if (up.basePrice !== undefined) item.basePrice = Number(up.basePrice);
          if (up.stockKg !== undefined) item.stockKg = Number(up.stockKg);
          if (up.grade !== undefined) item.grade = up.grade;
          if (up.badge !== undefined) item.badge = up.badge;
          if (up.status !== undefined) item.status = up.status;
        }
      });
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
      return sendJson(res, 200, { success: true, message: "All table updates synced to store!", products });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/orders' && req.method === 'GET') {
    return sendJson(res, 200, { success: true, orders });
  }

  if (pathname === '/api/orders/create' && req.method === 'POST') {
    try {
      const orderData = await parseBody(req);
      const newOrder = {
        id: `ESV-${1000 + orders.length + 1}`,
        customerName: orderData.customerName || "Customer",
        phone: orderData.phone || "N/A",
        area: orderData.area || "Karachi",
        address: orderData.address || "Standard Delivery",
        slot: orderData.slot || "Express (45 Mins)",
        paymentMethod: orderData.paymentMethod || "Cash on Delivery (COD)",
        items: orderData.items || [],
        originalTotal: orderData.total || 0,
        adjustedTotal: orderData.total || 0,
        status: "pending",
        rider: "Unassigned",
        createdAt: new Date().toISOString()
      };
      orders.unshift(newOrder);
      return sendJson(res, 201, { success: true, order: newOrder });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/orders/reconcile-weight' && req.method === 'POST') {
    try {
      const { orderId, itemId, actualKg } = await parseBody(req);
      const order = orders.find(o => o.id === orderId);
      if (!order) return sendJson(res, 404, { success: false, error: "Order not found" });

      const item = order.items.find(i => i.id === itemId);
      if (!item) return sendJson(res, 404, { success: false, error: "Item not found in order" });

      item.actualKg = Number(actualKg);
      // Recalculate price: base rate per kg * actualKg
      const prod = products.find(p => p.id === item.id);
      const ratePerKg = prod ? prod.basePrice : (item.unitPrice / (item.orderedKg || 1));
      item.adjustedPrice = Math.round(ratePerKg * item.actualKg);

      // Re-sum order total
      order.adjustedTotal = order.items.reduce((sum, it) => sum + (it.adjustedPrice !== undefined ? it.adjustedPrice : it.unitPrice), 0);
      return sendJson(res, 200, { success: true, order });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/orders/update-status' && req.method === 'POST') {
    try {
      const { orderId, status, rider } = await parseBody(req);
      const order = orders.find(o => o.id === orderId);
      if (!order) return sendJson(res, 404, { success: false, error: "Order not found" });

      if (status) order.status = status;
      if (rider) order.rider = rider;
      return sendJson(res, 200, { success: true, order });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/inventory/wastage' && req.method === 'POST') {
    try {
      const entry = await parseBody(req);
      const log = {
        id: `WST-${wastageLogs.length + 1}`,
        date: new Date().toISOString().split('T')[0],
        vegetable: entry.vegetable,
        initialArrivalKg: Number(entry.initialArrivalKg),
        gradeA_Kg: Number(entry.gradeA_Kg),
        gradeB_Kg: Number(entry.gradeB_Kg),
        gradeC_WastageKg: Number(entry.gradeC_WastageKg),
        reason: entry.reason || "Mandi sorting loss"
      };
      wastageLogs.unshift(log);
      return sendJson(res, 201, { success: true, wastageLogs });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  if (pathname === '/api/stats' && req.method === 'GET') {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.adjustedTotal || o.originalTotal || 0), 0);
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const activeCount = orders.filter(o => o.status !== 'delivered').length;
    const totalWastageKg = wastageLogs.reduce((sum, w) => sum + w.gradeC_WastageKg, 0);

    return sendJson(res, 200, {
      success: true,
      stats: {
        totalRevenue,
        deliveredCount,
        activeCount,
        totalOrders: orders.length,
        totalWastageKg
      },
      wastageLogs
    });
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);

  // If path doesn't have an extension, try index.html
  if (!ext && !fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (err2, content) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        }
      });
      return;
    }

    const contentType = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🥬 Engineer Sabzi Valy (ESV) Server is live!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🛒 Customer Storefront & ⚡ Admin Operations Portal`);
  console.log(`====================================================`);
});
