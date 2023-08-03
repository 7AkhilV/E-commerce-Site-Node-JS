const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator");

const User = require("../models/user");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

// Controller function for rendering the login page
exports.getLogin = (req, res, next) => {
  // Fetch and display any error messages from flash storage
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

// Controller function for rendering the signup page
exports.getSignup = (req, res, next) => {
  // Fetch and display any error messages from flash storage
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

// Controller function for processing login form data
exports.postLogin = (req, res, next) => {
  // Extract email and password from the request
  const email = req.body.email;
  const password = req.body.password;

  // Validate user input using express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  // Find the user in the database based on the provided email
  User.findOne({ email: email })
    .then((user) => {
      // Check if the user exists in the database
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or password.",
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
      }
      // Compare the provided password with the hashed password stored in the database
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          // If the passwords match, create a session and redirect to the homepage
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          // If the passwords don't match, display an error message on the login page
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid email or password.",
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [],
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for processing signup form data
exports.postSignup = (req, res, next) => {
  // Extract email and password from the request
  const email = req.body.email;
  const password = req.body.password;

  // Validate user input using express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  // Hash the password before saving it to the database
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      // Create a new user and save it to the database
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      res.redirect("/login");
      // return transporter.sendMail({
      //   to: email,
      //   from: '7akhilv@gmail.com',
      //   subject: 'Signup succeeded!',
      //   html: '<h1>You successfully signed up!</h1>'
      // });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for handling user logout
exports.postLogout = (req, res, next) => {
  // Destroy the session and redirect to the homepage
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

// Controller function for rendering the reset password page
exports.getReset = (req, res, next) => {
  // Fetch and display any error messages from flash storage
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

// Controller function for handling password reset requests
exports.postReset = (req, res, next) => {
  // Generate a reset token and save it to the user in the database
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found.");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        // Send a password reset email to the user
        // transporter.sendMail({
        //   to: req.body.email,
        //   from: "7akhilv@gmail.com",
        //   subject: "Password reset",
        //   html: `
        //     <p>You requested a password reset</p>
        //     <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
        //   `,
        // });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

// Controller function for rendering the new password page
exports.getNewPassword = (req, res, next) => {
  // Fetch the reset token from the URL and find the user in the database
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      // Fetch and display any error messages from flash storage
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Controller function for handling the new password submission
exports.postNewPassword = (req, res, next) => {
  // Extract the new password, user ID, and password token from the request
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

// Find the user in the database based on the reset token and user ID
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      // Hash the new password and save it to the user in the database
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
