// Controller function for rendering the 404 (Page Not Found) error page
exports.get404 = (req, res, next) => {
  // Render the 404 error page and pass required data to the view
  res.status(404).render("404", {
    pageTitle: "Page Not Found",
    path: "/404",
    isAuthenticated: req.session.isLoggedIn,
  });
};

// Controller function for rendering the 500 (Internal Server Error) page
exports.get500 = (req, res, next) => {
  // Render the 500 error page and pass required data to the view
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
};
