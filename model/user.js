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
  department:[{
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Department",
  }],
  empId:{
    type: String,
    required: true,
  },
  role:{
    type:Number,
    default:10001
  }
 
});

module.exports = mongoose.model('User', userSchema);
