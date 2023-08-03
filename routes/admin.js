const path = require("path");

const express = require("express");
const { body } = require("express-validator");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

// /admin/add-product => GET Route to render the "Add Product" page
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/products => GET Route to render the "Products" page
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST Route to add a product
router.post(
  "/add-product",
  [
    body("title").isString().isLength({ min: 3 }).trim(),
    body("price").isFloat(),
    body("description").isLength({ min: 5, max: 400 }).trim(),
  ],
  isAuth,
  adminController.postAddProduct
);

// GET Route to render the "Edit Product" page
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

// POST Route to edit a product
router.post(
  "/edit-product",
  [
    body("title").isString().isLength({ min: 3 }).trim(),
    body("price").isFloat(),
    body("description").isLength({ min: 5, max: 400 }).trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

// Route to delete a product - DELETE request
router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
