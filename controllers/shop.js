const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_KEY);

const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const Order = require("../models/order");
const product = require("../models/product");

const ITEMS_PER_PAGE = 2;

// Controller function for rendering the product list page
exports.getProducts = (req, res, next) => {
  // Fetch the current page number from the query parameters
  const page = +req.query.page || 1;
  let totalItems;

  // Count total number of products to enable pagination
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      // Fetch products for the current page with pagination
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      // Render the product list page with pagination data
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      // Error handling for database errors
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for rendering the product detail page
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  // Find the product by its ID and render the product detail page
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      // Error handling for database errors
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for rendering the main shop page with all products
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  // Count total number of products to enable pagination
  product
    .find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      // Fetch products for the current page with pagination
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      // Render the main shop page with pagination data
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      // Error handling for database errors
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for rendering the cart page
exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      // Render the cart page with the user's cart items
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      // Error handling for database errors
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for adding a product to the cart
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  // Find the product by its ID and add it to the user's cart
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      // Error handling for database errors
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for removing a product from the cart
exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      // Error handling for database errors
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for rendering the checkout page
exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      console.log(user.cart.items);
      products = user.cart.items;
      products.forEach((p) => {
        total += +p.quantity * +p.productId.price;
      });

      // Create a Stripe checkout session and render the checkout page
      return stripe.checkout.sessions.create({
        line_items: products.map((p) => {
          return {
            price_data: {
              currency: "inr",
              unit_amount: parseInt(Math.ceil(p.productId.price * 100)),
              product_data: {
                name: p.productId.title,
                description: p.productId.description,
              },
            },
            quantity: p.quantity,
          };
        }),
        mode: "payment",
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success", // => http://localhost:3000,
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        // Render the checkout page with the Stripe session ID
        pageTitle: "Checkout",
        path: "/checkout",
        products: products,
        totalSum: total.toFixed(2),
        sessionId: session.id,
      });
    })
    .catch((err) => {
      // Error handling for database and Stripe errors
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for handling successful checkout
exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      // Clear the user's cart after successful checkout
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      // Error handling for database errors
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for rendering the user's orders
exports.getOrders = (req, res, next) => {
  // Find orders belonging to the logged-in user and render the orders page
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      // Error handling for database errors
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for generating and rendering the invoice PDF
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        // If the order is not found, throw an error
        return next(new Error("No order found."));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        // If the order does not belong to the logged-in user, throw an error
        return next(new Error("Unauthorized"));
      }

      // Create a PDF invoice for the order and stream it to the response
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });
      pdfDoc.text("-----------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - " +
              prod.quantity +
              " x " +
              "$" +
              prod.product.price
          );
      });
      pdfDoc.text("---");
      pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);

      pdfDoc.end();
    })
    .catch((err) => next(err));
};
