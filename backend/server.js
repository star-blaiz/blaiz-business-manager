require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDatabase = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const storeRoutes = require("./routes/storeRoutes");
const workerRoutes = require("./routes/workerRoutes");
const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes");
const saleRoutes = require("./routes/saleRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const premiumRoutes = require("./routes/premiumRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/*
 * =========================================
 * BODY PARSING
 * =========================================
 *
 * Keep the raw body available for the
 * Paystack webhook.
 */

app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      if (
        req.originalUrl ===
        "/api/premium/webhook"
      ) {
        req.rawBody = buf;
      }
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "Blaiz Business Manager",
    message: "Blaiz Business Manager API is running 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/settings", settingsRoutes);

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Blaiz Business Manager server running on port ${PORT} 🚀`
    );
  });
};

startServer();