# VEXORA Admin Console (SPARE PRO)

Dedicated standalone administration and operations portal for SPARE PRO Wholesale and Dropshipping ecommerce platform.

## Features
- **Executive Dashboard**: Real-time sales, active reseller counts, orders, pending COD collections, gross revenue, net ledger balances.
- **Reseller Management**: Full KYC approval/rejection workflows, account suspension/activation, detailed profile inspection.
- **Catalog & Inventory**: Live product stock tracking, real-time stock decrement sync, category management.
- **Order Processing**: End-to-end lifecycle updates (Pending -> Confirmed -> Shipped -> Delivered -> Cancelled).
- **Cash On Delivery (COD) Remittance**: Courier collection tracking, automatic double-entry ledger credit upon collection.
- **Financial Balance Sheet & Double-Entry Ledger**: Immutable audit trail, payment reversals, manual adjustment journal entries.
- **Reports & Analytics**: Daily sales breakdown, courier collections, commission statements.

---

## Getting Started Locally

1. Install dependencies:
```bash
npm install
```

2. Start the development server (runs on port 5174):
```bash
npm run dev
```

3. Open `http://localhost:5174` in your browser.

---

## Super Admin Demo Credentials

| Field | Value |
|---|---|
| **Email** | `admin@sparepro.com` |
| **Password** | `Admin@SparePro2026!` |

*(Or click **"Fill Super Admin Demo"** on the login page.)*

---

## Deploy to Vercel (Standalone)

1. Import this repository (`mohammedfalaah/dropshipping_resellers_admin`) in Vercel.
2. Framework Preset: **Vite**
3. Root Directory: `./`
4. Environment Variables:
   - `VITE_API_BASE_URL`: `https://dropshippingresellers.vercel.app/api`
5. Click **Deploy**.
