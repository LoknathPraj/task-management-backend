const User = require("../model/user");
const Order = require("../model/order");
const Product = require("../model/product");
const Cart = require("../model/cart");

exports.placeOrder = async (req, res, next) => {
  const username = req.body.username;
  const delivery_address = req.body.delivery_address;
  const orderItems = req.body.order_items;
  const creator = req.userId;
  const mobile = req.body.mobile;
  const email = req.body.email;
  let total_price = 0;
  let productIds = [];

  // if(orderItems|| orderItems?.length==0){
  //   const error = new Error("Validation err.");
  //   error.statusCode = 422;
  //   throw error;
  // }
  if (orderItems) {
    productIds = orderItems.map((element) => element.id);
  }
  let orderId = await Order.countDocuments();

  Product.find({
    _id: { $in: productIds },
  })
    .then((products) => {
      let jsonObjectList = [];
      if (orderItems && orderItems.length > 0) {
        for (var i = 0; i < orderItems.length; i++) {
          total_price += products[i].price*orderItems[i].qty;

          let newObj = {
            _id: products[i]._id,
            title: products[i].title,
            price: products[i].price,
            category_id: products[i].category_id,
            imageUrl: products[i].imageUrl,
            description: products[i].description,
            qty: orderItems[i].qty,
          };

          jsonObjectList.push(newObj);
        }
      }

      const order = new Order({
        order_id: orderId + 1,
        username: username,
        total_price: total_price,
        delivery_address: delivery_address,
        creator: creator,
        orderItems: jsonObjectList,
        mobile: mobile,
        email: email,
      });
      return order.save();
    })
    .then((result) => {
      return Cart.deleteOne({ creator: req.userId });
    })
    .then((result) => {
      res.status(200).json({
        message: "Order Placed successfully",
        data: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ creator: req.userId })
    .then((order) => {
      if (order) {
        res.status(200).json({
          message: "Order list fetched successfully",
          data: order,
        });
      } else {
        res.status(200).json({
          message: "Order not found",
          data: [],
        });
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
