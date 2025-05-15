const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['fruit', 'vegetable'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,  // <- Make sure this exists
    required: true,
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
