
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    cartItems: 
        {
          type:Array,
         
        }
      ,
    creator: {
      type: Schema.Types.ObjectId,
      required: true,
      ref:'User'

    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', postSchema);

