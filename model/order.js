const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    order_id:{
type:Number,
required:true

    },
    status: {
      type: Number,
      default: 1,
    },
    username: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    total_price: {
        type: Number,
        required: true,
      },
    delivery_address: {
      type: String,
      required: true,
    },
    orderItems: {
      type: Array,
    },
    creator: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Order", orderSchema);
