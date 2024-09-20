const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    // select: false 
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'active'
  },
  role:{
    type:Number,
    default:10001
  }
 
});

module.exports = mongoose.model('User', userSchema);
