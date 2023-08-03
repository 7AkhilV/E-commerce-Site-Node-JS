const mongoose = require("mongoose");

const fileHelper = require("../util/file");

const { validationResult } = require("express-validator");

const Product = require("../models/product");

// Controller function for rendering the "Add Product" page
exports.getAddProduct = (req, res, next) => {
  // Render the "edit-product" view for adding a new product
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

// Controller function for adding a new product
exports.postAddProduct = (req, res, next) => {
  // Extract product data from the request
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  // Handle image upload validation
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: "Attached file is not an image.",
      validationErrors: [],
    });
  }

  // Validate user input using express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  // Save the product to the database
  const imageUrl = image.path;
  const product = new Product({
    // _id: new mongoose.Types.ObjectId('5badf72403fd8b5be0366e81'),
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user,
  });
  product
    .save()
    .then((result) => {
      // console.log(result);
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      // Error handling if product creation fails
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for rendering the "Edit Product" page
exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      // Render the "edit-product" view for editing an existing product
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      // Error handling if product retrieval fails
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for updating an existing product
exports.postEditProduct = (req, res, next) => {
  // Extract product data from the request
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  // Validate user input using express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      // Update product data
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (image) {
        // Delete previous image and store new image
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      // Save the updated product to the database
      return product.save().then((result) => {
        console.log("UPDATED PRODUCT!");
        res.redirect("/admin/products");
      });
    })
    .catch((err) => {
      // Error handling if product update fails
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for rendering the "Admin Products" page
exports.getProducts = (req, res, next) => {
  // Fetch and display products belonging to the current user
  Product.find({ userId: req.user._id })
    .then((products) => {
      console.log(products);
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      // Error handling if product retrieval fails
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for deleting a product
exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found."));
      }
      // Delete product image and remove the product from the database
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log("DESTROYED PRODUCT");
      res.status(200).json({ message: "success" });
    })
    .catch((err) => {
      // Error handling if product deletion fails
      res.status(500).json({ message: "Deleting product failed" });
    });
};
