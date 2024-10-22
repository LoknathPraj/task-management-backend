
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const departmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
   
    is_active: {
        type: Boolean,
        default: true
      },
  },
  { timestamps: true }
 
);

// Add a virtual field to populate projects
departmentSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'department',
});

module.exports = mongoose.model('Department', departmentSchema);

