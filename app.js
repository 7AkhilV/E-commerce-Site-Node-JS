// Import required modules
const path = require("path");
const fs = require("fs");
const https = require("https");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

// Import controllers and models
const errorController = require("./controllers/error");
const User = require("./models/user");

// MongoDB connection URI
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.w5b2eln.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

// Express app instance
const app = express();

// Set up MongoDB session store
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

// Set up CSRF protection
const csrfProtection = csrf();

// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

// Multer file storage
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

// Multer file filter to allow only images
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// view engine and views directory
app.set("view engine", "ejs");
app.set("views", "views");

// Import route modules
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

//  morgan logger middlewar
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

// (Middleware) Helmet for security headers
app.use(helmet());

// (Middleware) Compression for response compression
app.use(compression());

// (Middleware) Morgan for access logging
app.use(morgan("combined", { stream: accessLogStream }));

// Body parser middleware for parsing request bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Multer middleware for handling file uploads
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

// Serve static files from the "public" directory (css files and js files for views)
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded images
app.use("/images", express.static(path.join(__dirname, "images")));

// Session setup
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// CSRF protection
app.use(csrfProtection);
// Connect-flash for flash messages
app.use(flash());

// Set local variables for views to be used in EJS templates
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Middleware to fetch user details from the database based on the session data
app.use((req, res, next) => {
  // throw new Error('Sync Dummy');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

// Set up routes
app.use("/admin", adminRoutes); // Admin routes
app.use(shopRoutes); // Shop routes
app.use(authRoutes); // Authentication routes

// Error handling middleware for 500 (internal server error)
app.get("/500", errorController.get500);

// Error handling middleware for 404 (not found) route
app.use(errorController.get404);

// Error handling middleware for other errors
app.use((error, req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

// Connect to MongoDB and start the server
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    //   .listen(process.env.PORT || 3000);
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
  });
