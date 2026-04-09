// ============================================================
// BLINKBASKET — server.js (v1.1)
// Stack: Node.js + Express + Supabase (PostgreSQL)
// Deploy: Vercel (serverless)
// ============================================================

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const PDFDocument = require("pdfkit");
const cron = require("node-cron");
const cors = require("cors");
require('dotenv').config();
const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// ============================================================
// CLIENTS
// ============================================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ============================================================
// HELPERS
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET || "blinkbasket_secret";
const SALT_ROUNDS = 12;

/** Sign a JWT for a user row */
function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

/** Express middleware — verifies Bearer JWT */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(header.replace("Bearer ", ""), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Middleware — must be admin */
function adminOnly(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Admin access required" });
  next();
}

/**
 * Haversine distance in km between two lat/lng pairs.
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Send email helper */
async function sendMail(to, subject, html) {
  await mailer.sendMail({ from: process.env.MAIL_USER, to, subject, html });
}

/** Send SMS helper */
async function sendSMS(to, body) {
  if (!to) return;
  await twilioClient.messages.create({ from: process.env.TWILIO_PHONE, to, body });
}

// ============================================================
// ── AUTH ROUTES ─────────────────────────────────────────────
// Purpose: User authentication (signup, login, OAuth)
// ============================================================

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user with email & password
 * @access  Public
 * @body    { email, password, full_name?, phone? }
 * @returns { token, user }
 */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const { data, error } = await supabase
      .from("users")
      .insert({ email, password: hashed, full_name, phone, provider: "local" })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ token: signToken(data), user: { id: data.id, email: data.email, role: data.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email & password
 * @access  Public
 * @body    { email, password }
 * @returns { token, user }
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.provider === "google")
      return res.status(400).json({ error: "Please use Google login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ token: signToken(user), user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   POST /api/auth/google
 * @desc    Handle Google OAuth login - upsert user from OAuth callback
 * @access  Public
 * @body    { email, full_name?, phone? }
 * @returns { token, user }
 */
app.post("/api/auth/google", async (req, res) => {
  try {
    const { email, full_name, phone } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const { data, error } = await supabase
      .from("users")
      .upsert({ email, full_name, phone, provider: "google", password: null }, { onConflict: "email" })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ token: signToken(data), user: { id: data.id, email: data.email, role: data.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ── CATEGORIES ──────────────────────────────────────────────
// Purpose: Product category management (CRUD)
// ============================================================

/**
 * @route   GET /api/categories
 * @desc    Get all categories (sorted by name)
 * @access  Public
 * @returns Array of categories
 */
app.get("/api/categories", async (_req, res) => {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * @route   POST /api/categories
 * @desc    Create a new category (admin only)
 * @access  Private/Admin
 * @body    { name, image_url? }
 * @returns Created category
 */
app.post("/api/categories", auth, adminOnly, async (req, res) => {
  const { name, image_url } = req.body;
  const { data, error } = await supabase.from("categories").insert({ name, image_url }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category by ID (admin only)
 * @access  Private/Admin
 * @body    { name, image_url? }
 * @returns Updated category
 */
app.put("/api/categories/:id", auth, adminOnly, async (req, res) => {
  const { name, image_url } = req.body;
  const { data, error } = await supabase
    .from("categories")
    .update({ name, image_url })
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category by ID (admin only)
 * @access  Private/Admin
 * @returns { success: true }
 */
app.delete("/api/categories/:id", auth, adminOnly, async (req, res) => {
  const { error } = await supabase.from("categories").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// ============================================================
// ── MANUFACTURERS ───────────────────────────────────────────
// Purpose: Brand/manufacturer management (CRUD)
// ============================================================

/**
 * @route   GET /api/manufacturers
 * @desc    Get all manufacturers (sorted by name)
 * @access  Public
 * @returns Array of manufacturers
 */
app.get("/api/manufacturers", async (_req, res) => {
  const { data, error } = await supabase.from("manufacturers").select("*").order("name");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * @route   POST /api/manufacturers
 * @desc    Create a new manufacturer (admin only)
 * @access  Private/Admin
 * @body    { name }
 * @returns Created manufacturer
 */
app.post("/api/manufacturers", auth, adminOnly, async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase.from("manufacturers").insert({ name }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @route   PUT /api/manufacturers/:id
 * @desc    Update a manufacturer by ID (admin only)
 * @access  Private/Admin
 * @body    { name }
 * @returns Updated manufacturer
 */
app.put("/api/manufacturers/:id", auth, adminOnly, async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase
    .from("manufacturers")
    .update({ name })
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @route   DELETE /api/manufacturers/:id
 * @desc    Delete a manufacturer by ID (admin only)
 * @access  Private/Admin
 * @returns { success: true }
 */
app.delete("/api/manufacturers/:id", auth, adminOnly, async (req, res) => {
  const { error } = await supabase.from("manufacturers").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// ============================================================
// ── PRODUCTS ────────────────────────────────────────────────
// Purpose: Product catalog management (CRUD + filtering)
// ============================================================

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering, sorting, and pagination
 * @access  Public
 * @query   { category_id, manufacturer_id, is_featured, search, min_price, max_price, sort, order, page, limit }
 * @returns { data, count, page, limit }
 */
app.get("/api/products", async (req, res) => {
  try {
    const {
      category_id,
      manufacturer_id,
      is_featured,
      search,
      min_price,
      max_price,
      sort = "created_at",
      order = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;

    let query = supabase
      .from("products")
      .select(
        "*, categories(name), manufacturers(name), product_variants(*)",
        { count: "exact" }
      )
      .eq("is_active", true)
      .range(from, to)
      .order(sort, { ascending: order === "asc" });

    if (category_id) query = query.eq("category_id", category_id);
    if (manufacturer_id) query = query.eq("manufacturer_id", manufacturer_id);
    if (is_featured !== undefined) query = query.eq("is_featured", is_featured === "true");
    if (search) query = query.ilike("name", `%${search}%`);
    if (min_price) query = query.gte("price", min_price);
    if (max_price) query = query.lte("price", max_price);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data, count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /api/products/:slug
 * @desc    Get a single product by SEO-friendly slug
 * @access  Public
 * @returns Product details with variants
 */
app.get("/api/products/:slug", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name), manufacturers(name), product_variants(*)")
    .eq("slug", req.params.slug)
    .eq("is_active", true)
    .single();

  if (error) return res.status(404).json({ error: "Product not found" });
  res.json(data);
});

/**
 * @route   POST /api/products
 * @desc    Create a new product (admin only)
 * @access  Private/Admin
 * @body    { name, description, slug, price, stock, images, extra_details, is_featured, category_id, manufacturer_id }
 * @returns Created product
 */
app.post("/api/products", auth, adminOnly, async (req, res) => {
  const {
    name, description, slug, price, stock, images,
    extra_details, is_featured, category_id, manufacturer_id,
  } = req.body;

  const { data, error } = await supabase
    .from("products")
    .insert({ name, description, slug, price, stock, images, extra_details, is_featured, category_id, manufacturer_id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product by ID (admin only)
 * @access  Private/Admin
 * @body    { name, description, slug, price, stock, images, extra_details, is_featured, is_active, category_id, manufacturer_id }
 * @returns Updated product
 */
app.put("/api/products/:id", auth, adminOnly, async (req, res) => {
  const allowed = ["name","description","slug","price","stock","images","extra_details","is_featured","is_active","category_id","manufacturer_id"];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock quantity (admin only) - triggers notifications if low stock
 * @access  Private/Admin
 * @body    { stock }
 * @returns Updated product
 */
app.patch("/api/products/:id/stock", auth, adminOnly, async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || stock < 0)
    return res.status(400).json({ error: "Valid stock value required" });

  const { data, error } = await supabase
    .from("products")
    .update({ stock })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Soft delete a product (sets is_active = false) (admin only)
 * @access  Private/Admin
 * @returns { success: true }
 */
app.delete("/api/products/:id", auth, adminOnly, async (req, res) => {
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// ============================================================
// ── PRODUCT VARIANTS ────────────────────────────────────────
// Purpose: Manage product variants (size, color, etc.)
// ============================================================

/**
 * @route   GET /api/products/:id/variants
 * @desc    Get all active variants for a product
 * @access  Public
 * @returns Array of product variants
 */
app.get("/api/products/:id/variants", async (req, res) => {
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", req.params.id)
    .eq("is_active", true);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * @route   POST /api/products/:id/variants
 * @desc    Create a new variant for a product (admin only)
 * @access  Private/Admin
 * @body    { variant_name, price, stock }
 * @returns Created variant
 */
app.post("/api/products/:id/variants", auth, adminOnly, async (req, res) => {
  const { variant_name, price, stock } = req.body;
  const { data, error } = await supabase
    .from("product_variants")
    .insert({ product_id: req.params.id, variant_name, price, stock })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @route   PUT /api/variants/:id
 * @desc    Update a product variant by ID (admin only)
 * @access  Private/Admin
 * @body    { variant_name, price, stock, is_active }
 * @returns Updated variant
 */
app.put("/api/variants/:id", auth, adminOnly, async (req, res) => {
  const { variant_name, price, stock, is_active } = req.body;
  const { data, error } = await supabase
    .from("product_variants")
    .update({ variant_name, price, stock, is_active })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @route   DELETE /api/variants/:id
 * @desc    Soft delete a product variant (sets is_active = false) (admin only)
 * @access  Private/Admin
 * @returns { success: true }
 */
app.delete("/api/variants/:id", auth, adminOnly, async (req, res) => {
  const { error } = await supabase
    .from("product_variants")
    .update({ is_active: false })
    .eq("id", req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// ============================================================
// ── CART ────────────────────────────────────────────────────
// ============================================================

/** Ensure a cart exists for this user, return its id */
async function ensureCart(userId) {
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  return created.id;
}

/** GET /cart — user's full cart with product + variant details */
app.get("/cart", auth, async (req, res) => {
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", req.user.id)
    .single();

  if (!cart) return res.json({ items: [] });

  const { data, error } = await supabase
    .from("cart_items")
    .select("*, products(id, name, images, price, slug), product_variants(id, variant_name, price)")
    .eq("cart_id", cart.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data });
});

/** POST /cart — add or increment item (upsert by conflict) */
app.post("/cart", auth, async (req, res) => {
  try {
    const { product_id, variant_id = null, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ error: "product_id is required" });

    const cartId = await ensureCart(req.user.id);

    const { error } = await supabase.rpc("upsert_cart_item", {
      p_cart_id: cartId,
      p_product_id: product_id,
      p_variant_id: variant_id,
      p_quantity: quantity,
    });

    // Fallback: Supabase doesn't have the RPC yet — do it manually
    if (error) {
      // Try insert; on conflict update quantity
      await supabase
        .from("cart_items")
        .upsert(
          { cart_id: cartId, product_id, variant_id, quantity },
          { onConflict: "cart_id,product_id,variant_id", ignoreDuplicates: false }
        );
    }

    const { data: items } = await supabase
      .from("cart_items")
      .select("*, products(name, images, price), product_variants(variant_name, price)")
      .eq("cart_id", cartId);

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /cart/:itemId — set exact quantity */
app.patch("/cart/:itemId", auth, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: "Quantity must be >= 1" });

  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", req.params.itemId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/** DELETE /cart/:itemId — remove one item */
app.delete("/cart/:itemId", auth, async (req, res) => {
  const { error } = await supabase.from("cart_items").delete().eq("id", req.params.itemId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

/** DELETE /cart — clear entire cart */
app.delete("/cart", auth, async (req, res) => {
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", req.user.id)
    .single();

  if (cart) await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  res.json({ success: true });
});

// ============================================================
// ── DELIVERY CHECK ──────────────────────────────────────────
// ============================================================

/** GET /delivery/check?lat=...&lng=... */
app.get("/delivery/check", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng are required" });

    const { data: hubs, error } = await supabase
      .from("serviceable_locations")
      .select("*");

    if (error) return res.status(500).json({ error: error.message });

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    const covered = hubs.some((hub) => {
      const dist = haversineKm(userLat, userLng, parseFloat(hub.latitude), parseFloat(hub.longitude));
      return dist <= parseFloat(hub.service_radius_km);
    });

    if (covered) return res.json({ available: true });
    res.json({ available: false, message: "Sorry, we don't deliver to your location yet." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ── SERVICEABLE LOCATIONS (admin) ───────────────────────────
// ============================================================

app.get("/locations", auth, adminOnly, async (_req, res) => {
  const { data, error } = await supabase.from("serviceable_locations").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/locations", auth, adminOnly, async (req, res) => {
  const { name, latitude, longitude, service_radius_km } = req.body;
  const { data, error } = await supabase
    .from("serviceable_locations")
    .insert({ name, latitude, longitude, service_radius_km })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

app.put("/locations/:id", auth, adminOnly, async (req, res) => {
  const { name, latitude, longitude, service_radius_km } = req.body;
  const { data, error } = await supabase
    .from("serviceable_locations")
    .update({ name, latitude, longitude, service_radius_km })
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete("/locations/:id", auth, adminOnly, async (req, res) => {
  const { error } = await supabase.from("serviceable_locations").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// ============================================================
// ── ORDERS ──────────────────────────────────────────────────
// ============================================================

/** Helper: snapshot cart → order_items + decrement stock */
async function finaliseOrder(orderId, userId) {
  // Fetch user's cart + items
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!cart) throw new Error("Cart not found");

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("*, products(price, stock), product_variants(price, stock, variant_name)")
    .eq("cart_id", cart.id);

  if (!cartItems || cartItems.length === 0) throw new Error("Cart is empty");

  // Build order_items rows (price snapshot)
  const orderItemRows = cartItems.map((item) => {
    const price = item.product_variants?.price ?? item.products.price;
    return {
      order_id: orderId,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      variant_name: item.product_variants?.variant_name || null,
      quantity: item.quantity,
      price,
    };
  });

  await supabase.from("order_items").insert(orderItemRows);

  // Decrement stock per item
  for (const item of cartItems) {
    if (item.variant_id) {
      const newStock = Math.max(0, item.product_variants.stock - item.quantity);
      await supabase
        .from("product_variants")
        .update({ stock: newStock })
        .eq("id", item.variant_id);
    } else {
      const newStock = Math.max(0, item.products.stock - item.quantity);
      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.product_id);
    }
  }

  // Clear cart
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);
}

/**
 * POST /orders/razorpay/create — step 1: create Razorpay order
 * Body: { amount } (in paise)
 */
app.post("/orders/razorpay/create", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    res.json({ razorpay_order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /orders/razorpay/verify — step 2: verify + insert order
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, delivery_address, pincode, total }
 */
app.post("/orders/razorpay/verify", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      delivery_address,
      pincode,
      total,
    } = req.body;

    // Verify HMAC signature
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json({ error: "Payment verification failed" });

    // Insert order (triggers set invoice_id + status='placed')
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: req.user.id,
        payment_method: "online",
        payment_status: "paid",
        payment_reference: razorpay_payment_id,
        delivery_address,
        pincode,
        total,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await finaliseOrder(order.id, req.user.id);

    res.json({ success: true, invoice_id: order.invoice_id, order_id: order.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /orders/cod — place a Cash on Delivery order
 * Body: { delivery_address, pincode, total }
 */
app.post("/orders/cod", auth, async (req, res) => {
  try {
    const { delivery_address, pincode, total } = req.body;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: req.user.id,
        payment_method: "cod",
        payment_status: "unpaid",
        delivery_address,
        pincode,
        total,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await finaliseOrder(order.id, req.user.id);

    res.json({ success: true, invoice_id: order.invoice_id, order_id: order.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /orders — user's own order history */
app.get("/orders", auth, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name, images))")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/** GET /orders/:id — single order detail */
app.get("/orders/:id", auth, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name, images, slug), product_variants(variant_name))")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "Order not found" });

  // Users can only view their own orders; admin can view all
  if (req.user.role !== "admin" && data.user_id !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });

  res.json(data);
});

/** GET /orders/:id/invoice — download PDF invoice */
app.get("/orders/:id/invoice", auth, async (req, res) => {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name))")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "Order not found" });
  if (req.user.role !== "admin" && order.user_id !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${order.invoice_id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text("BlinkBasket", { align: "center" });
  doc.fontSize(12).text(`Invoice: ${order.invoice_id}`, { align: "center" });
  doc.moveDown();
  doc.text(`Date: ${new Date(order.created_at).toDateString()}`);
  doc.text(`Payment: ${order.payment_method.toUpperCase()} — ${order.payment_status}`);
  doc.text(`Status: ${order.status}`);
  doc.moveDown();
  doc.text("Items:", { underline: true });
  order.order_items.forEach((item) => {
    doc.text(`  ${item.products.name}${item.variant_name ? ` (${item.variant_name})` : ""} × ${item.quantity} @ ₹${item.price}`);
  });
  doc.moveDown();
  doc.fontSize(14).text(`Total: ₹${order.total}`, { bold: true });
  doc.end();
});

// ============================================================
// ── ADMIN: ORDER MANAGEMENT ─────────────────────────────────
// ============================================================

/** GET /admin/orders — all orders with filters */
app.get("/admin/orders", auth, adminOnly, async (req, res) => {
  const { status, payment_method, payment_status, page = 1, limit = 20 } = req.query;
  const from = (page - 1) * limit;
  const to = from + Number(limit) - 1;

  let query = supabase
    .from("orders")
    .select("*, users(email, full_name, phone), order_items(*, products(name))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (payment_method) query = query.eq("payment_method", payment_method);
  if (payment_status) query = query.eq("payment_status", payment_status);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, count });
});

/** PATCH /admin/orders/:id/status — advance order status */
app.patch("/admin/orders/:id/status", auth, adminOnly, async (req, res) => {
  const VALID = ["placed", "processing", "out_for_delivery", "delivered", "completed"];
  const { status } = req.body;

  if (!VALID.includes(status))
    return res.status(400).json({ error: `Invalid status. Valid: ${VALID.join(", ")}` });

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/** PATCH /admin/orders/:id/payment — mark COD order as paid */
app.patch("/admin/orders/:id/payment", auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", req.params.id)
    .eq("payment_method", "cod")
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ============================================================
// ── ADMIN: REPORTS ──────────────────────────────────────────
// ============================================================

/** GET /admin/reports/sales?month=2024-11 — monthly product-wise sales */
app.get("/admin/reports/sales", auth, adminOnly, async (req, res) => {
  const { month } = req.query; // e.g. "2024-11"
  let query = supabase
    .from("order_items")
    .select("product_id, quantity, price, products(name), orders(created_at, status)");

  if (month) {
    const start = `${month}-01`;
    const end = new Date(new Date(start).setMonth(new Date(start).getMonth() + 1))
      .toISOString()
      .slice(0, 10);
    query = query.gte("orders.created_at", start).lt("orders.created_at", end);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Group by product
  const report = {};
  data.forEach(({ product_id, quantity, price, products }) => {
    if (!report[product_id]) {
      report[product_id] = { product_id, name: products?.name, total_qty: 0, total_revenue: 0 };
    }
    report[product_id].total_qty += quantity;
    report[product_id].total_revenue += quantity * price;
  });

  res.json(Object.values(report).sort((a, b) => b.total_revenue - a.total_revenue));
});

/** GET /admin/reports/customers — order-wise customer report */
app.get("/admin/reports/customers", auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("user_id, total, users(email, full_name)");

  if (error) return res.status(500).json({ error: error.message });

  const report = {};
  data.forEach(({ user_id, total, users }) => {
    if (!report[user_id]) {
      report[user_id] = { user_id, email: users?.email, name: users?.full_name, order_count: 0, total_spent: 0 };
    }
    report[user_id].order_count += 1;
    report[user_id].total_spent += parseFloat(total);
  });

  res.json(Object.values(report).sort((a, b) => b.total_spent - a.total_spent));
});

// ============================================================
// ── STOCK ALERTS ────────────────────────────────────────────
// ============================================================

/** POST /alerts/stock — subscribe to restock alert */
app.post("/alerts/stock", auth, async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: "product_id required" });

  const { error } = await supabase
    .from("stock_alerts")
    .upsert({ user_id: req.user.id, product_id, notified: false }, { onConflict: "user_id,product_id" });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, message: "We will notify you when this is back!" });
});

/** DELETE /alerts/stock/:productId — unsubscribe */
app.delete("/alerts/stock/:productId", auth, async (req, res) => {
  const { error } = await supabase
    .from("stock_alerts")
    .delete()
    .eq("user_id", req.user.id)
    .eq("product_id", req.params.productId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

/** GET /alerts/stock — user's active subscriptions */
app.get("/alerts/stock", auth, async (req, res) => {
  const { data, error } = await supabase
    .from("stock_alerts")
    .select("*, products(id, name, slug, images)")
    .eq("user_id", req.user.id)
    .eq("notified", false);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ============================================================
// ── NOTIFICATION CRON WORKER (every 60s) ───────────────────
// ============================================================

async function processNotifications() {
  const { data: pending, error } = await supabase
    .from("notifications_queue")
    .select("*, users(email, phone, full_name), products(name, slug)")
    .eq("sent", false)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error || !pending?.length) return;

  for (const notif of pending) {
    try {
      if (notif.type === "USER_STOCK_AVAILABLE" && notif.users) {
        const productUrl = `${process.env.FRONTEND_URL}/products/${notif.products?.slug}`;
        await sendMail(
          notif.users.email,
          `${notif.products?.name} is back in stock! 🛒`,
          `<p>Hi ${notif.users.full_name || "there"},</p>
           <p><strong>${notif.products?.name}</strong> is back in stock on BlinkBasket.</p>
           <p><a href="${productUrl}">Shop now →</a></p>`
        );
        if (notif.users.phone) {
          await sendSMS(
            notif.users.phone,
            `BlinkBasket: ${notif.products?.name} is back in stock! ${productUrl}`
          );
        }
      } else if (notif.type === "ADMIN_LOW_STOCK") {
        await sendMail(
          process.env.ADMIN_EMAIL,
          `⚠️ Low stock alert: ${notif.products?.name}`,
          `<p>Stock for <strong>${notif.products?.name}</strong> has dropped below 5 units on BlinkBasket.</p>
           <p>Please restock soon.</p>`
        );
      }

      // Mark as sent only after successful dispatch
      await supabase.from("notifications_queue").update({ sent: true }).eq("id", notif.id);
    } catch (err) {
      console.error(`Notification ${notif.id} failed:`, err.message);
      // Row stays sent=false → retried next cycle
    }
  }
}

// Only run cron in a persistent environment (not Vercel serverless edge)
if (process.env.NODE_ENV !== "production" || process.env.ENABLE_CRON === "true") {
  cron.schedule("* * * * *", processNotifications);
  console.log("Notification cron worker started (60s interval)");
}

// ============================================================
// ── ADMIN: NOTIFICATIONS QUEUE ──────────────────────────────
// ============================================================

/** GET /admin/notifications — monitor failed/pending notifications */
app.get("/admin/notifications", auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from("notifications_queue")
    .select("*, products(name), users(email)")
    .eq("sent", false)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * POST /admin/notifications/process — manually trigger the notification worker
 * Useful on Vercel where cron isn't persistent. Call this from a Vercel cron job
 * (vercel.json > crons) hitting this endpoint every minute.
 */
app.post("/admin/notifications/process", auth, adminOnly, async (_req, res) => {
  try {
    await processNotifications();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ── USER PROFILE ────────────────────────────────────────────
// ============================================================

/** GET /me */
app.get("/me", auth, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, phone, role, provider, created_at")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(404).json({ error: "User not found" });
  res.json(data);
});

/** PUT /me — update profile */
app.put("/me", auth, async (req, res) => {
  const { full_name, phone } = req.body;
  const { data, error } = await supabase
    .from("users")
    .update({ full_name, phone })
    .eq("id", req.user.id)
    .select("id, email, full_name, phone, role")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/** PATCH /me/password — change password (local accounts only) */
app.patch("/me/password", auth, async (req, res) => {
  const { current_password, new_password } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("password, provider")
    .eq("id", req.user.id)
    .single();

  if (user.provider === "google")
    return res.status(400).json({ error: "Google accounts cannot change password here" });

  const match = await bcrypt.compare(current_password, user.password);
  if (!match) return res.status(401).json({ error: "Current password is incorrect" });

  const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
  await supabase.from("users").update({ password: hashed }).eq("id", req.user.id);
  res.json({ success: true });
});

// ============================================================
// ── ADMIN: USER LIST ────────────────────────────────────────
// ============================================================

app.get("/admin/users", auth, adminOnly, async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const from = (page - 1) * limit;
  const to = from + Number(limit) - 1;

  let query = supabase
    .from("users")
    .select("id, email, full_name, phone, role, provider, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("email", `%${search}%`);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, count });
});

/** PATCH /admin/users/:id/role */
app.patch("/admin/users/:id/role", auth, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role))
    return res.status(400).json({ error: "Role must be 'user' or 'admin'" });

  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", req.params.id)
    .select("id, email, role")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ============================================================
// ── HEALTHCHECK ─────────────────────────────────────────────
// ============================================================

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "1.1", timestamp: new Date().toISOString() });
});

// ============================================================
// ── 404 FALLBACK ────────────────────────────────────────────
// ============================================================

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ============================================================
// ── START (local dev) / EXPORT (Vercel) ─────────────────────
// ============================================================

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`BlinkBasket API running on http://localhost:${PORT}`));
}

module.exports = app;
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);