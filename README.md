<div align="center">

# 🛒 BlinkBasket

**A full-stack online grocery management platform built for speed, reliability, and a modern user experience.**

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

---

## 📌 Overview

BlinkBasket is a feature-rich grocery e-commerce platform with a full admin panel. It supports product discovery, variant-based products (size/weight/pack options), cart management, geo-based delivery checks, multiple payment modes, auto-generated invoices, stock alerts, and admin reporting — all powered by a fully automated backend with PostgreSQL triggers.

---

## ✨ Features

- **Product Catalog** — Categories, manufacturers, featured products, and SEO-friendly slugs
- **Product Variants** — Each product supports multiple size/weight/pack options with independent price & stock
- **Extra Details** — Admin can attach any key-value metadata (e.g. `shelf_life`, `allergens`) to any product
- **Advanced Search** — Filter by category, manufacturer, price, and popularity
- **Geo-Based Delivery Check** — Haversine distance check against serviceable hub locations
- **Persistent Cart** — One cart per user with upsert quantity logic; variant-aware
- **Out-of-Stock Alerts** — Users subscribe; system auto-notifies on restock via email + SMS
- **Order Lifecycle** — `placed → processing → out_for_delivery → delivered / completed`
- **Auto-Generated Invoices** — `INV-101` style IDs via Postgres BEFORE INSERT trigger
- **Payments** — Razorpay (UPI, cards, net banking) + Cash on Delivery
- **Monthly Sales Reports** — Product-wise and customer-wise reporting for admin
- **Automated Notification Worker** — Email + SMS dispatched via 60-second cron job

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Payments | Razorpay |
| Email | Nodemailer + Gmail SMTP |
| SMS | Twilio |
| PDF | PDFKit (server-side invoice generation) |
| File Storage | Supabase Storage |
| Scheduling | node-cron (notification worker) |
| State (FE) | Zustand (cart + auth) |
| Data Fetching | TanStack Query |

---

## 🗃️ Database Schema (v1.1)

BlinkBasket uses **13 PostgreSQL tables** managed through Supabase. All primary keys use `BIGSERIAL` for fast integer joins.

### Core Tables

| Table | Purpose |
|---|---|
| `users` | Stores customers and admins; supports local + Google OAuth |
| `categories` | Product categories (e.g. Dairy, Fruits, Beverages) |
| `manufacturers` | Brand info (e.g. Amul, Nestlé, ITC) |
| `products` | Full product data; `images` is a `jsonb` array; `price` is optional when variants are used |
| `product_variants` | Size/weight/pack options per product with independent `price` and `stock` |

### Cart Tables

| Table | Purpose |
|---|---|
| `carts` | One cart per user enforced via `UNIQUE(user_id)` |
| `cart_items` | Line items with variant support; upsert on conflict prevents duplicates |

### Order Tables

| Table | Purpose |
|---|---|
| `orders` | Created only after confirmed payment; `invoice_id` and `status` auto-set by triggers |
| `order_items` | Price and variant snapshots captured at checkout time |

### Alert & Notification Tables

| Table | Purpose |
|---|---|
| `stock_alerts` | User subscriptions for out-of-stock products |
| `notifications_queue` | Decoupled queue polled by the Node.js cron worker |

### Delivery Table

| Table | Purpose |
|---|---|
| `serviceable_locations` | Hub coordinates + service radius for geo-based delivery checks |

---

## ⚡ Postgres Triggers & Automation

BlinkBasket uses **3 PostgreSQL triggers** to automate critical business logic atomically — no extra API calls needed.

### Trigger 1 — Auto Invoice ID
Fires `BEFORE INSERT` on `orders`. Sets `invoice_id = 'INV-' + order_id`.

> **Why BEFORE and not AFTER?** An `AFTER INSERT` trigger receives a read-only `NEW`. Only `BEFORE INSERT` allows mutating `NEW` before the row is written.

### Trigger 2 — Stock Automation
Fires `AFTER UPDATE OF stock` on `products`. Handles two cases:

| Condition | Action |
|---|---|
| `old.stock = 0 AND new.stock > 0` | Inserts `USER_STOCK_AVAILABLE` into `notifications_queue` for every subscribed user; marks alerts as `notified = true` |
| `new.stock < 5 AND old.stock >= 5` | Inserts `ADMIN_LOW_STOCK` into `notifications_queue` once (guard prevents repeated inserts) |

### Trigger 3 — Order Status Initializer *(v1.1)*
Fires `BEFORE INSERT` on `orders`. Guarantees `status = 'placed'` on every new order — no application code needed.

---

## 🔄 Key Workflows

### Authentication
- **Local:** bcrypt-hashed password → JWT in httpOnly cookie
- **Google OAuth:** Supabase Auth handles redirect → upsert user with `provider='google'`

### Cart (Variant-Aware)
```
User selects variant → backend ensures cart exists → upsert cart_items
ON CONFLICT (cart_id, product_id, variant_id) DO UPDATE SET quantity = quantity + excluded.quantity
```

### Delivery Check
```
Frontend sends { lat, lng } → backend fetches serviceable_locations
→ Haversine distance per hub → available if distance ≤ service_radius_km
```

### Checkout — Online Payment (Razorpay)
```
Create Razorpay order → Open modal → Payment success
→ Verify HMAC signature server-side → INSERT into orders
→ Triggers fire (invoice_id + status='placed')
→ Copy cart_items to order_items (price + variant snapshot)
→ Decrement stock → Clear cart
```

> **Key Rule:** If Razorpay payment fails or the modal is closed, nothing is inserted. The `orders` table only ever contains confirmed orders.

### Checkout — COD
```
User confirms order → INSERT into orders (payment_status='unpaid')
→ Same triggers fire → Same cart clear + stock decrement
→ Admin marks paid=true on physical delivery
```

### Order Status Lifecycle

```
placed → processing → out_for_delivery → delivered → completed
  ↑                                                        ↑
Auto (trigger)                                    Admin manual update
```

### Out-of-Stock Alert Flow
```
User clicks "Notify Me" → POST /alerts/stock → upsert stock_alerts
Admin updates stock → AFTER UPDATE trigger fires
→ Inserts notifications_queue rows → cron worker picks up within 60s
→ Sends email + SMS → marks sent=true
```

---

## 📬 Notification System

The notification system is split into two decoupled layers:

1. **Postgres trigger** — writes rows to `notifications_queue (sent=false)`
2. **Node.js cron worker** — polls every 60 seconds, sends email (Nodemailer) + SMS (Twilio), marks `sent=true` only after successful dispatch. Failed sends are retried on the next cycle.

| Type | Recipient | Channel |
|---|---|---|
| `USER_STOCK_AVAILABLE` | Subscribed user | Email + SMS |
| `ADMIN_LOW_STOCK` | Admin | Email only |

---

## 🗂️ Admin Panel Capabilities

- Add / edit / soft-delete categories and manufacturers
- Add / edit products with images (jsonb array), variants, stock, price, extra metadata
- View all orders — filter by date, payment method, payment status, and order status
- Update order status through the full lifecycle
- Mark COD orders as paid
- View monthly product-wise and customer-wise sales reports
- Monitor `notifications_queue` for failed delivery retries

---

## 🔧 Environment Variables

Create a `.env` file in your backend root:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # Never expose on frontend

# Email (Nodemailer)
MAIL_USER=your_gmail_address
MAIL_PASS=your_gmail_app_password

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE=+1234567890

# Admin
ADMIN_EMAIL=admin@yourdomain.com

# App
FRONTEND_URL=https://your-frontend-url.com

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

---

## 🗄️ Database Setup

Run the complete v1.1 schema in your **Supabase SQL editor**. The schema includes all 13 tables, 10 indexes (including GIN indexes for `jsonb` columns), and all 3 triggers.

> You can find the full copy-paste database schema ready in `/database_schema.txt`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (PostgreSQL)
- Razorpay account
- Twilio account
- Gmail account with App Password enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/Sourjya-Saha/blinkbasket.git
cd blinkbasket

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Running Locally

```bash
# Start the backend (from /backend)
npm run dev

# Start the frontend (from /frontend)
npm run dev
```

Frontend runs on `http://localhost:3000` · Backend runs on `http://localhost:5000`

---

## 📄 License

This project is private and not open for public use or redistribution.

---

<div align="center">
  Built by <a href="https://github.com/Sourjya-Saha">Sourjya</a>
</div>
