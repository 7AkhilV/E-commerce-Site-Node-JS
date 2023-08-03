const path = require("path");

const express = require("express");

const shopController = require("../controllers/shop");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

// Route to render the "Home" page - HTTP GET request
router.get("/", shopController.getIndex);

// Route to render the "Products" page - HTTP GET request
router.get("/products", shopController.getProducts);

// Route to render the "Product Detail" page - HTTP GET request
router.get("/products/:productId", shopController.getProduct);

// Route to render the "Cart" page - HTTP GET request
router.get("/cart", isAuth, shopController.getCart);

// Route to handle adding products to the cart - HTTP POST request
router.post("/cart", isAuth, shopController.postCart);

// Route to handle removing products from the cart - HTTP POST request
router.post("/cart-delete-item", isAuth, shopController.postCartDeleteProduct);

// Route to render the "Checkout" page - HTTP GET request
router.get("/checkout", isAuth, shopController.getCheckout);

// Route to handle successful checkout - HTTP GET request
router.get("/checkout/success", shopController.getCheckoutSuccess);

// Route to handle cancelled checkout - HTTP GET request
router.get("/checkout/cancel", shopController.getCheckout);

// Route to render the "Orders" page - HTTP GET request
router.get("/orders", isAuth, shopController.getOrders);

// Route to render the "Invoice" (PDF) for a specific order - HTTP GET request
router.get("/orders/:orderId", isAuth, shopController.getInvoice);

module.exports = router;
