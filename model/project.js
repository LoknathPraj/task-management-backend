
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    department:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Department",
      },
      adminId:{
        type: Schema.Types.ObjectId,
        
        ref: "User",
      },
    is_active: {
        type: Boolean,
        default: true
      },
  },
  { timestamps: true }
 
);

module.exports = mongoose.model('Project', projectSchema);

