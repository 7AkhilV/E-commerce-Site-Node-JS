const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product", // Reference to the "Product" model
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

// Method to add a product to the user's cart
userSchema.methods.addToCart = function (product) {
  // Check if the product is already in the cart
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  // If the product is already in the cart, increase its quantity
  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    // If the product is not in the cart, add it as a new item
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }
  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return this.save();
};

// Method to remove a product from the user's cart
userSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

// Method to clear the user's cart
userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
