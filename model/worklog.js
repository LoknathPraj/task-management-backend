const mongoose = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const worklogSchema = new Schema(
  {
    project_name: {
      type: String,
      required: true,
    },
    projectId: {
      type: String,
      required: true,
    },
    task_type: {
      type: String,
      required: true,
    },
    working_hrs: {
      type: String,
      required: true,
    },
    working_mins:{
      type: Number,
      required: true,
      default:0
    },
    working_date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    task_description: {
      type: String,
      required: true,
      unique: true
    },
    username: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    departmentId:{
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Department",
    },
  },
  { timestamps: true }
);
worklogSchema.plugin(uniqueValidator);
module.exports = mongoose.model("WorkLog", worklogSchema);
