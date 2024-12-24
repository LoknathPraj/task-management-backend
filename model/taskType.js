
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    projectName: {
      type: String,
      required: true
    },
    projectId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Project",
      },

      adminId:{
        type: Schema.Types.ObjectId,
        ref: "User",
      },
 
  },
  { timestamps: true }
 
);

module.exports = mongoose.model('TaskType', taskTypeSchema);

