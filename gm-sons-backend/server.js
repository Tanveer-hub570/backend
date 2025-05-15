const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');

const Product = require('./models/productModel');
const Order = require('./models/orderModel');
const User = require('./models/userModel');

const mockProducts = require('./mockData');
const mockUsers = require('./mockUsers');
const mockOrders = require('./mockOrders');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

const loadMockData = async () => {
  try {
    // Insert products if none exist
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany(mockProducts);
      console.log("✅ Mock products inserted into database.");
    } else {
      console.log("ℹ️ Products already exist. Skipping mock insert.");
    }

    // Insert users if none exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany(mockUsers);
      console.log("✅ Mock users inserted into database.");
    } else {
      console.log("ℹ️ Users already exist. Skipping mock insert.");
    }

    // Insert orders if none exist
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      // Build lookup maps for user emails and product names
      const users = await User.find({}, '_id email');
      const products = await Product.find({}, '_id name');

      const userMap = new Map(users.map(u => [u.email.toLowerCase(), u._id]));
      const productMap = new Map(products.map(p => [p.name.toLowerCase(), p._id]));

      // Prepare orders with references replaced by IDs
      const ordersToInsert = mockOrders.map(order => {
        const userId = userMap.get(order.userEmail.toLowerCase());
        if (!userId) {
          console.error(`❌ User email "${order.userEmail}" not found in database. Skipping this order.`);
          return null; // skip order if user not found
        }

        const orderItems = order.orderItems.map(item => {
          const productId = productMap.get(item.name.toLowerCase());
          if (!productId) {
            throw new Error(`❌ Product name "${item.name}" not found in database.`);
          }
          return {
            product: productId,
            qty: item.qty,
            price: item.price,
            image: item.image,
          };
        });

        return {
          user: userId,
          orderItems,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod,
          itemsPrice: order.itemsPrice,
          taxPrice: order.taxPrice,
          shippingPrice: order.shippingPrice,
          totalPrice: order.totalPrice,
          isPaid: order.isPaid,
          isDelivered: order.isDelivered,
          createdAt: order.createdAt,
        };
      }).filter(Boolean); // remove nulls

      if (ordersToInsert.length > 0) {
        await Order.insertMany(ordersToInsert);
        console.log(`✅ Mock orders inserted into database. Count: ${ordersToInsert.length}`);
      } else {
        console.log("ℹ️ No valid orders to insert.");
      }
    } else {
      console.log("ℹ️ Orders already exist. Skipping mock insert.");
    }
  } catch (err) {
    console.error("❌ Error inserting mock data:", err);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await loadMockData();
});
