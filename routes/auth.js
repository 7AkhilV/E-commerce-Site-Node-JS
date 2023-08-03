const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

// Route to render the "Login" page - HTTP GET request
router.get("/login", authController.getLogin);

// Route to render the "Signup" page - HTTP GET request
router.get("/signup", authController.getSignup);

// Route to handle login - HTTP POST request
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    body("password", "Password has to be valid.")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

// Route to handle user signup - HTTP POST request
router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        // if (value === 'test@test.com') {
        //   throw new Error('This email address if forbidden.');
        // }
        // return true;
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "E-Mail exists already, please pick a different one."
            );
          }
        });
      })
      .normalizeEmail(),
    body(
      "password",
      "Please enter a password with only numbers and text and at least 5 characters."
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords have to match!");
        }
        return true;
      }),
  ],
  authController.postSignup
);

// Route to handle user logout - HTTP POST request
router.post("/logout", authController.postLogout);

// Route to render the "Reset Password" page - HTTP GET request
router.get("/reset", authController.getReset);

// Route to handle password reset request - HTTP POST request
router.post("/reset", authController.postReset);

// Route to render the "New Password" page with a reset token - HTTP GET request
router.get("/reset/:token", authController.getNewPassword);

// Route to handle setting a new password after reset - HTTP POST request
router.post("/new-password", authController.postNewPassword);

module.exports = router;
