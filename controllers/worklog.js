const { validationResult } = require("express-validator");
const WorkLog = require("../model/worklog");
const User = require("../model/user");
const excelJS = require("exceljs");
const path = require("path");
const os = require("os");
const fs = require("fs");


exports.getAllWorkLog = async (req, res, next) => {

  const currentPage = parseInt(req.query?.page) || 1;
  const limit = req.query?.limit || 10;

  console.log(currentPage, limit, "page and limit at get all worklog");

  let count = await WorkLog.find({ adminId: req.adminId }).countDocuments();
  WorkLog.find({ adminId: req.adminId })
    .skip((currentPage - 1) * limit)
    .sort({ working_date: -1 })
    .limit(limit)
    .then((result) => {
      res.status(201).json({
        message: "Task details fetched successfully!",
        totalItems: count,
        currentPage,
        data: result,
      });
    })
    .catch((err) => {

    });
};


exports.getTodaysWorkLog = async (req, res, next) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {

    const result = await WorkLog.find({
      working_date: { $gte: startOfDay, $lte: endOfDay },
      adminId: req.adminId
    });

    const uniqueUsersMap = result.reduce((acc, worklog) => {
      if (!acc[worklog.userId]) {
        acc[worklog.userId] = [];
      }
      acc[worklog.userId].push(worklog);
      return acc;
    }, {});

    const userStats = await Promise.all(
      Object.keys(uniqueUsersMap).map(async (userId) => {
        const worklogs = uniqueUsersMap[userId];

        let totalHours = 0;
        let totalSubmissions = 0;

        for (let worklog of worklogs) {
          totalSubmissions += 1;
          totalHours += parseFloat(worklog.working_hrs) + (parseFloat(worklog.working_mins) / 60);
        }
        const worklog = worklogs[0];

        return {
          ...worklog.toObject(),
          totalSubmissions,
          totalHours,
          id: worklog.userId,
        };
      })
    );

    res.status(200).json({
      message: "Today's work logs fetched successfully!",
      data: userStats,
    });
  } catch (err) {

    res.status(500).json({
      message: "An error occurred while fetching today's work logs.",
      error: err,
    });
  }
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
    projectId,
    working_hrs,
    working_mins,
    working_date,
    location,
    task_description,
    username,
    departmentId

  } = req.body;


  const worklog = new WorkLog({
    project_name: project_name,
    projectId: projectId,
    task_type: task_type,
    working_hrs: working_hrs,
    working_mins: working_mins,
    working_date: working_date,
    location: location,
    task_description: task_description,
    username: username,
    userId: userId,
    departmentId: departmentId,
    adminId: req.adminId
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
  const currentPage = parseInt(req.query?.page) || 1;
  const limit = req.query?.limit || 10;
  const userId = req.userId;
  let count = await WorkLog.find({ userId: userId }).countDocuments();
  WorkLog.find({ userId: userId })
    .sort({ working_date: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .then((result) => {
      res.status(201).json({
        message: "Task List feteched successfully!",
        totalItems: count,
        currentPage,
        data: result,
      });
    })
    .catch((err) => {

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

    });
};

exports.deleteWorkLogById = (req, res, next) => {
  const workLogId = req.params.workLogId;

  WorkLog.findById(workLogId)
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
    departmentId
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
      worklog.departmentId = departmentId
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

exports.exportWorklog = async (req, res, next) => {
  const workbook = new excelJS.Workbook(); // Create a new workbook
  const worksheet = workbook.addWorksheet('Worklog');

  let departmentIds = req?.query?.departmentIds
  let userId = req?.query?.userId

  if (departmentIds && departmentIds?.includes(',')) {
    departmentIds = departmentIds.split(",")
  } else if (departmentIds) {
    departmentIds = [departmentIds]
  }

  let query = {}


  if (Array.isArray(departmentIds) && departmentIds?.length > 0 && userId) {
    query = { departmentId: { $in: departmentIds }, userId: userId }
  } else if (Array.isArray(departmentIds) && departmentIds?.length > 0 && !userId) {
    query = { departmentId: { $in: departmentIds } }
  }

  console.log(query)

  // New Worksheet
  // const path = "./"; // Path to download excel
  // res.setHeader(
  //   "Content-Type",
  //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  // );
  // res.setHeader("Content-Disposition", "attachment; filename=" + "users.xlsx");

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

  const workLogs = await WorkLog.find(query)
    // .select("-departmentId")//exclude
    .sort({ working_date: -1 })
    .then((result) => result);
  let counter = 1;
  console.log(workLogs)
  workLogs.forEach((worklog) => {
    worklog.s_no = counter;
    worklog.working_hrs = worklog.working_hrs + "." + worklog.working_mins + "hrs";
    worklog.working_date = new Date(worklog.working_date).toLocaleDateString();
    worksheet.addRow(worklog); // Add data in worksheet
    counter++;
  });
  // Making first line in excel bold
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  try {
    // Write the workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers to trigger a download
    res.setHeader('Content-Disposition', 'attachment; filename=worklog.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
    // const filename = getDownloadsFolder();
    // const data1 = await workbook.xlsx.write()
    // const data = await workbook.xlsx.writeFile(`${filename}`).then(() => {
    //   res.send({
    //     status: "success",
    //     message: "file successfully downloaded",
    //     path: `${filename}`,
    //   });
    // });
  } catch (err) {

    res.send({
      status: "error",
      message: err?.message,
    });
  }
};
