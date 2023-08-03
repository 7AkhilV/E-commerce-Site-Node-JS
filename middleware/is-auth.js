// Middleware to check if the user is authenticated (logged in)
module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    // If not logged in, redirect the user to the login page
    return res.redirect("/login");
  }
  // If logged in, continue to the next middleware or route handler
  next();
};
