
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    price:{
    type:Number,
    required :true
    },
    category_id:{
        type: Schema.Types.ObjectId,
        required: true,
        ref:'Category'
    },
    imageUrl: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', postSchema);

