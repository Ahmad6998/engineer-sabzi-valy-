# 🥦 Engineer Sabzi Valy (انجینئر سبزی والے)

> **Farm-Fresh Produce Direct to Your Doorstep with 100% Certified Digital Weighing**  
> *Inspired by the operational and storefront excellence of [Fresh Basket](https://freshbasket.com.pk/)*

---

## 🌟 Overview

**Engineer Sabzi Valy (ESV)** is a modern fresh produce e-commerce and daily grocery logistics ecosystem designed for Karachi. It bridges the gap between daily morning wholesale vegetable markets (*Sabzi Mandi*) and urban households by providing transparent digital weighing, daily calibrated prices, and rapid 45-minute express delivery.

---

## 🚀 Key Features

### 🛒 1. Customer Storefront (`/`)
* **Category Navigation:** 
  * 🥦 Fresh Vegetables (آلو، پیاز، ٹماٹر، بھنڈی، گاجر)
  * 🍎 Fresh Fruits (سیب، کیلا)
  * 🌿 Herbs & Seasoning (ادرک، لہسن، ہری مرچ، پالک)
  * 📦 Value Kitchen Bundles (Weekly Sabzi Basket)
* **Dynamic Portion & Weight Selector:** Buy by `250g`, `500g`, `1 kg`, `2 kg`, or bundles with instant dynamic price calculation.
* **Smart Stepper Cards:** Fresh Basket-style product cards with direct `[-] [Qty] [+]` counters.
* **Sliding Cart Drawer:** Animated Free Delivery progress bar (threshold Rs. 999), delivery slot picker (Morning, Afternoon, Evening, Express).
* **Frictionless Checkout:** Cash on Delivery (COD), JazzCash, EasyPaisa.
* **Automated WhatsApp Receipt Simulator:** Instant breakdown of the order sent to the customer.

### ⚡ 2. Admin & Mandi Operations Portal (`/admin` or top toggle)
* **Morning Mandi Pricing Engine:** Bulk update wholesale procurement costs and profit margins between 05:30 AM – 07:00 AM; 1-click publishing updates customer rates live.
* **Digital Scale & Actual Weight Reconciliation:** Packing station interface to calibrate actual weighed produce (e.g., ordered 1.0kg, scale reads 0.98kg or 1.04kg) with automatic invoice recalculation for 100% fair weighing.
* **Perishable Inventory & Wastage:** Grade sorting (Grade A online store, Grade B discount, Grade C compost) with real-time shrinkage rate tracking.
* **Rider Dispatch & COD Cash Register:** Pipeline tracking (Pending, Packing, Dispatched, Delivered) and rider cash-in-hand verification.

---

## 💻 How to Run

The project is built with zero unnecessary dependencies and starts instantly:

```bash
# 1. Start the server
npm start
# or: node server.js

# 2. Open in your browser:
# http://localhost:3000
```

---

## 📂 Project Structure

```
esv/
├── index.html                  # Complete responsive Storefront & Admin Portal
├── server.js                   # Node.js HTTP server & REST APIs
├── package.json                # Project name: engineer-sabzi-valy
├── public/
│   └── assets/
│       ├── products/           # Vegetable & fruit photos
│       ├── banners/            # Promotional banners
│       └── branding/           # Brand logo and icons
├── src/
│   └── data/
│       └── products.json       # Master product catalog with mandi costs & weights
└── README.md
```
