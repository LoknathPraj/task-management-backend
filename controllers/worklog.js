const { validationResult } = require("express-validator");
const WorkLog = require("../model/worklog");
const User = require("../model/user");
const excelJS = require("exceljs");
const path = require("path");
const os = require("os");
const fs = require("fs");
exports.getAllWorkLog = async (req, res, next) => {
  const currentPage = req.query?.pageNo || 1;
  const perPage = req.query?.pageSize || 30;
  let count = await WorkLog.find().countDocuments();
  WorkLog.find()
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .then((result) => {
      res.status(201).json({
        message: "Task details feteched successfully!",
        totalItems: count,
        data: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.AddWorklog = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  const userId = req.userId;
  const {
    task_type,
    project_name,
    working_hrs,
    working_mins,
    working_date,
    location,
    task_description,
    username,
  } = req.body;
  const worklog = new WorkLog({
    project_name: project_name,
    task_type: task_type,
    working_hrs: working_hrs,
    working_mins: working_mins,
    working_date: working_date,
    location: location,
    task_description: task_description,
    username: username,
    userId: userId,
  });
  worklog
    .save()
    .then((result) => {
      res.status(201).json({
        message: "Saved worklog successfully!",
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

exports.getWorkLogByUserId = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const userId = req.userId;
  const perPage = 30;
  let count = await WorkLog.find({ userId: userId }).countDocuments();
  WorkLog.find({ userId: userId })
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .then((result) => {
      res.status(201).json({
        message: "Task List feteched successfully!",
        totalItems: count,
        data: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.filterWorkLogByUserId = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const userId = req.params.userId;
  const perPage = 30;
  let count = await WorkLog.find({ userId: userId }).countDocuments();
  WorkLog.find({ userId: userId })
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .then((result) => {
      res.status(200).json({
        message: "Task List feteched successfully!",
        totalItems: count,
        data: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deleteWorkLogById = (req, res, next) => {
  const workLogId = req.params.workLogId;

  WorkLog.findById(workLogId)
    .then((worklog) => {
      console.log(worklog);
      if (!worklog) {
        const error = new Error("Could not find worklog.");
        error.statusCode = 404;
        throw error;
      }
      if (worklog.userId.toString() !== req.userId) {
        const error = new Error("Not Authorized.");
        error.statusCode = 403;
        throw error;
      }
      return WorkLog.findByIdAndRemove(workLogId);
    })
    .then((result) => {
      return res
        .status(200)
        .json({ message: "Worklog Deleted successfully", data: result });
    })

    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateWorklogById = (req, res, next) => {
  const {
    task_type,
    project_name,
    working_hrs,
    working_mins,
    working_date,
    location,
    task_description,
  } = req.body;
  const worklogId = req.params.workLogId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  WorkLog.findById(worklogId)
    .then((worklog) => {
      if (!worklog) {
        const error = new Error("Could not find worklog.");
        error.statusCode = 404;
        throw error;
      }
      if (worklog.userId.toString() !== req.userId) {
        const error = new Error("Not Authorized.");
        error.statusCode = 403;
        throw error;
      }
      worklog.working_mins = working_mins;
      worklog.task_type = task_type;
      worklog.project_name = project_name;
      worklog.working_hrs = working_hrs;
      worklog.task_type = task_type;
      worklog.working_date = working_date;
      worklog.task_description = task_description;
      worklog.location = location;
      return worklog.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Work Log updated!", worklog: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUserList = async (req, res, next) => {
  User.find({})
    .select("-password")
    .then((result) => {
      res.status(200).json({
        message: "User List feteched successfully!",
        data: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

function getDownloadsFolder() {
  const homeDir = os.homedir();
  if (homeDir.startsWith("/Users/")) {
    return homeDir + "/Downloads/" + new Date().toISOString() + "worklog.xlsx";
  } else {
    return homeDir + "/Downloads/worklog.xlsx";
  }
}

exports.exportUser = async (req, res, next) => {
  const workbook = new excelJS.Workbook(); // Create a new workbook
  const worksheet = workbook.addWorksheet("My Users"); // New Worksheet
  const path = "./"; // Path to download excel
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=" + "users.xlsx");

  // Column for data in excel. key must match data key
  worksheet.columns = [
    { header: "S no.", key: "s_no", width: 10 },
    { header: "Project Name", key: "project_name", width: 15 },
    { header: "User Name", key: "username", width: 15 },
    { header: "Task Type", key: "task_type", width: 15 },
    { header: "Location", key: "location", width: 15 },
    { header: "Working Hrs", key: "working_hrs", width: 15 },
    { header: "Task Description", key: "task_description", width: 100 },
    { header: "Working Date", key: "working_date", width: 10 },
  ];

  const userList = await WorkLog.find({})
    .select("-_id")
    .then((result) => result);
  let counter = 1;
  userList.forEach((user) => {
    user.s_no = counter;
    user.working_hrs = user.working_hrs + "." + user.working_mins + "hrs";
    user.working_date = new Date(user.working_date).toLocaleDateString();
    worksheet.addRow(user); // Add data in worksheet
    counter++;
  });
  // Making first line in excel bold
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  try {
    const filename = getDownloadsFolder();
    const data = await workbook.xlsx.writeFile(`${filename}`).then(() => {
      res.send({
        status: "success",
        message: "file successfully downloaded",
        path: `${filename}`,
      });
    });
  } catch (err) {
    console.log(err);
    res.send({
      status: "error",
      message: "Something went wrong",
    });
  }
};
