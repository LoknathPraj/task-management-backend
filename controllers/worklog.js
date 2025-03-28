const { validationResult } = require("express-validator");
const WorkLog = require("../model/worklog");
const User = require("../model/user");
const excelJS = require("exceljs");
const path = require("path");
const os = require("os");
const fs = require("fs");
const mongoose = require("mongoose");

exports.getAllWorkLog = async (req, res, next) => {

  const currentPage = parseInt(req.query?.page) || 1;
  const limit = req.query?.limit || 10;

  let count = await WorkLog.find({ adminId: req.adminId }).countDocuments();

  // Fetch unique locations from the database
  const uniqueLocations = await WorkLog.distinct('location', { adminId: req.adminId });

  WorkLog.find({ adminId: req.adminId })
    .skip((currentPage - 1) * limit)
    .sort({ working_date: -1 })
    .limit(limit)
    .then((result) => {
      // Count the number of locations in the result that are part of the unique locations
      const locationCount = result?.reduce((acc, worklog) => {
        if (uniqueLocations.includes(worklog.location)) {
          acc.add(worklog.location);
        }
        return acc;
      }, new Set()).size;

      res.status(201).json({
        message: "Task details fetched successfully!",
        totalItems: count,
        currentPage,
        locationCount,
        data: result,
      });
    })
    .catch((err) => {

    });
};


exports.getTodaysWorkLog = async (req, res, next) => {
  const currentPage = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const count = await WorkLog.countDocuments({
      working_date: { $gte: startOfDay, $lte: endOfDay },
      adminId: req.adminId,
    });

    const result = await WorkLog.find({
      working_date: { $gte: startOfDay, $lte: endOfDay },
      adminId: req.adminId,
    })
      .skip((currentPage - 1) * limit)
      .limit(limit);

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
      currentPage,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    res.status(500).json({
      message: "An error occurred while fetching today's work logs.",
      error: err,
    });
  }
};

async function getEmployeesPresentTillMonth(month, year) {
  try {
    // Get the last day of the month at 23:59:59
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));



    // Fetch users to debug who is being counted
    const users = await User.find({
      joiningDate: { $lte: endOfMonth }  // Employees who joined on or before this month
    });






    // Aggregate to count employees
    const result = await User.aggregate([
      {
        $match: {
          joiningDate: { $lte: endOfMonth } // Employees who joined on or before this month
        }
      },
      {
        $count: "totalEmployees"
      }
    ]);



    return result.length > 0 ? result[0].totalEmployees : 0;
  } catch (error) {
    console.error("Error getting employees till the month:", error);
    return 0;
  }
}

exports.getYearlyWorkHours = async (year) => {
  try {
    let yearlyData = [];

    for (let month = 1; month <= 12; month++) {
      const users = await getEmployeesPresentTillMonth(month, year);
      let workingDaysInMonth = 0;
      const daysInMonth = new Date(year, month, 0).getDate(); // Get the number of days in the month

      // all the days in the month and count weekdays (Monday to Friday)
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        // Check if it's a weekday (not Saturday (6) or Sunday (0))
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDaysInMonth++;
        }
      }

      // Calculate the expected hours for the month (excluding weekends)
      let expectedHours = users * workingDaysInMonth * 8; 

      const result = await WorkLog.aggregate([
        {
          $match: {
            $expr: {
              $and: [
                { $eq: [{ $year: "$working_date" }, year] },
                { $eq: [{ $month: "$working_date" }, month] }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            total_hours: { $sum: { $toDouble: "$working_hrs" } },
            total_minutes: { $sum: "$working_mins" }
          }
        },
        {
          $project: {
            _id: 0,
            total_hours: {
              $add: [
                "$total_hours",
                { $divide: ["$total_minutes", 60] } 
              ]
            }
          }
        }
      ]);

      // If work hours exist, calculate percentage
      let totalWorkedHours = result.length > 0 ? result[0].total_hours : 0;
      let percentageHours = 0;
      if (expectedHours > 0) {
        percentageHours = (totalWorkedHours / expectedHours)*100;
      }

      yearlyData.push({
        month,
        year,
        totalWorkedHours,
        percentageHours: percentageHours || 0,
        users,
        expectedHours,
        expectedDays: workingDaysInMonth, // Store the actual number of working days
      });
    }

    return yearlyData;
  } catch (error) {
    console.error("Error calculating yearly work hours:", error);
    throw new Error("Error calculating yearly work hours: " + error.message);
  }
  console.log(`Month: ${month}, Working Days: ${workingDaysInMonth}`);
};

exports.getUserTotalWorkHoursForMonth = async (req, res, next) => {
  const { userId, month, year } = req.query;
  console.log(userId, month, year, "at user's total hours");
  if (!userId || !month || !year) {
    return res.status(400).json({
      message: "Missing required parameters: userId, month, and year.",
    });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await WorkLog.aggregate([
      {
        $match: {
          userId: userObjectId,
          $expr: {
            $and: [
              { $eq: [{ $year: "$working_date" }, parseInt(year)] },
              { $eq: [{ $month: "$working_date" }, parseInt(month)] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total_hours: { $sum: { $toDouble: "$working_hrs" } },
          total_minutes: { $sum: "$working_mins" },
        },
      },
      {
        $project: {
          _id: 0,
          total_hours: {
            $add: [
              "$total_hours",
              { $divide: ["$total_minutes", 60] },
            ],
          },
        },
      },
    ]);

    let totalWorkedHours = result.length > 0 ? result[0].total_hours : 0;

    return res.status(200).json({
      message: "User's total working hours for the month fetched successfully!",
      totalWorkedHours,
      userId,
      month,
      year,
    });
  } catch (error) {
    console.error("Error calculating total work hours:", error);
    return res.status(500).json({
      message: "An error occurred while calculating total work hours.",
      error: error.message,
    });
  }
};

exports.getAllUsersTotalWorkHoursForMonthAndDay = async (req, res, next) => { 
  const { month, year } = req.query;
  const currentPage = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  
  if (!month || !year) {
    return res.status(400).json({
      message: "Missing required parameters: month and year.",
    });
  }
  const currentDate = new Date(); 
  const currentDay = currentDate.getDate(); 
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;


  try {
    const totalCount = await WorkLog.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: "$working_date" }, parseInt(year)] },
              { $eq: [{ $month: "$working_date" }, parseInt(month)] }
            ]
          }
        }
      },
      { $group: { _id: "$userId" } } 
    ]);

    const totalUsers = totalCount.length;

    const result = await WorkLog.aggregate([

      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: "$working_date" }, parseInt(year)] },
              { $eq: [{ $month: "$working_date" }, parseInt(month)] }
            ]
          }
        }
      },
   
      {
        $group: {
          _id: "$userId",
          total_hours: { $sum: { $toDouble: "$working_hrs" } },
          total_minutes: { $sum: "$working_mins" },
          username: { $first: "$username" },
          total_month_submissions: { $sum: 1 },
          current_day_hours: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $dayOfMonth: "$working_date" }, currentDay] },
                    { $eq: [{ $year: "$working_date" }, currentYear] },
                    { $eq: [{ $month: "$working_date" }, currentMonth] }
                  ]
                },
                { $toDouble: "$working_hrs" },
                0
              ]
            }
          },
          current_day_minutes: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $dayOfMonth: "$working_date" }, currentDay] },
                    { $eq: [{ $year: "$working_date" }, currentYear] },
                    { $eq: [{ $month: "$working_date" }, currentMonth] }
                  ]
                },
                "$working_mins",
                0
              ]
            }
          },
          current_day_submissions: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $dayOfMonth: "$working_date" }, currentDay] },
                    { $eq: [{ $year: "$working_date" }, currentYear] },
                    { $eq: [{ $month: "$working_date" }, currentMonth] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $skip: (currentPage - 1) * limit
      },
      {
        $limit: limit
      },
      {
        $sort: { "working_date": -1 } // Sorting by working_date in descending order
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          total_hours: {
            $add: [
              "$total_hours",
              { $divide: ["$total_minutes", 60] }
            ]
          },
          username: 1,
          total_month_submissions: 1,
          current_day_hours: {
            $add: [
              "$current_day_hours",
              { $divide: ["$current_day_minutes", 60] }
            ]
          },
          current_day_submissions: 1
        }
      }
    ]);

    if (result.length === 0) {
      return res.status(404).json({
        message: "No work hours found for the specified month and year.",
      });
    }

    return res.status(200).json({
      message: "Users' total working hours for the month and current day fetched successfully!",
      data: result,
      month,
      year,
      totalItems: totalUsers,
      currentPage,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.error("Error calculating total work hours:", error);

    return res.status(500).json({
      message: "An error occurred while calculating total work hours.",
      error: error.message,
    });
  }
};
async function getEmployeesPresentTillMonth(month, year) {
  try {
    // Get the last day of the month at 23:59:59
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));
   // Fetch users to debug who is being counted
    const users = await User.find({
      joiningDate: { $lte: endOfMonth }  // Employees who joined on or before this month
    });






    // Aggregate to count employees
    const result = await User.aggregate([
      {
        $match: {
          joiningDate: { $lte: endOfMonth } // Employees who joined on or before this month
        }
      },
      {
        $count: "totalEmployees"
      }
    ]);



    return result.length > 0 ? result[0].totalEmployees : 0;
  } catch (error) {
    console.error("Error getting employees till the month:", error);
    return 0;
  }
}

exports.getYearlyWorkHours = async (year) => {
  try {
    let yearlyData = [];

    for (let month = 1; month <= 12; month++) {
      const users = await getEmployeesPresentTillMonth(month, year);
      let workingDaysInMonth = 0;
      const daysInMonth = new Date(year, month, 0).getDate(); // Get the number of days in the month

      // all the days in the month and count weekdays (Monday to Friday)
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        // Check if it's a weekday (not Saturday (6) or Sunday (0))
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDaysInMonth++;
        }
      }

      // Calculate the expected hours for the month (excluding weekends)
      let expectedHours = users * workingDaysInMonth * 8; 

      const result = await WorkLog.aggregate([
        {
          $match: {
            $expr: {
              $and: [
                { $eq: [{ $year: "$working_date" }, year] },
                { $eq: [{ $month: "$working_date" }, month] }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            total_hours: { $sum: { $toDouble: "$working_hrs" } },
            total_minutes: { $sum: "$working_mins" }
          }
        },
        {
          $project: {
            _id: 0,
            total_hours: {
              $add: [
                "$total_hours",
                { $divide: ["$total_minutes", 60] } 
              ]
            }
          }
        }
      ]);

      // If work hours exist, calculate percentage
      let totalWorkedHours = result.length > 0 ? result[0].total_hours : 0;
      let percentageHours = 0;
      if (expectedHours > 0) {
        percentageHours = (totalWorkedHours / expectedHours)*100;
      }

      yearlyData.push({
        month,
        year,
        totalWorkedHours,
        percentageHours: percentageHours || 0,
        users,
        expectedHours,
        expectedDays: workingDaysInMonth, // Store the actual number of working days
      });
    }

    return yearlyData;
  } catch (error) {
    console.error("Error calculating yearly work hours:", error);
    throw new Error("Error calculating yearly work hours: " + error.message);
  }
  console.log(`Month: ${month}, Working Days: ${workingDaysInMonth}`);
};

exports.getUserTotalWorkHoursForMonth = async (req, res, next) => {
  const { userId, month, year } = req.query;
  console.log(userId, month, year, "at user's total hours");
  if (!userId || !month || !year) {
    return res.status(400).json({
      message: "Missing required parameters: userId, month, and year.",
    });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await WorkLog.aggregate([
      {
        $match: {
          userId: userObjectId,
          $expr: {
            $and: [
              { $eq: [{ $year: "$working_date" }, parseInt(year)] },
              { $eq: [{ $month: "$working_date" }, parseInt(month)] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total_hours: { $sum: { $toDouble: "$working_hrs" } },
          total_minutes: { $sum: "$working_mins" },
        },
      },
      {
        $project: {
          _id: 0,
          total_hours: {
            $add: [
              "$total_hours",
              { $divide: ["$total_minutes", 60] },
            ],
          },
        },
      },
    ]);

    let totalWorkedHours = result.length > 0 ? result[0].total_hours : 0;

    return res.status(200).json({
      message: "User's total working hours for the month fetched successfully!",
      totalWorkedHours,
      userId,
      month,
      year,
    });
  } catch (error) {
    console.error("Error calculating total work hours:", error);
    return res.status(500).json({
      message: "An error occurred while calculating total work hours.",
      error: error.message,
    });
  }
};

exports.getAllUsersTotalWorkHoursForMonthAndDay = async (req, res, next) => { 
  const { month, year } = req.query;
  const currentPage = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 10;
  
  if (!month || !year) {
    return res.status(400).json({
      message: "Missing required parameters: month and year.",
    });
  }
  const currentDate = new Date(); 
  const currentDay = currentDate.getDate(); 
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;


  try {
    const totalCount = await WorkLog.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: "$working_date" }, parseInt(year)] },
              { $eq: [{ $month: "$working_date" }, parseInt(month)] }
            ]
          }
        }
      },
      { $group: { _id: "$userId" } } 
    ]);

    const totalUsers = totalCount.length;

    const result = await WorkLog.aggregate([

      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: "$working_date" }, parseInt(year)] },
              { $eq: [{ $month: "$working_date" }, parseInt(month)] }
            ]
          }
        }
      },
   
      {
        $group: {
          _id: "$userId",
          total_hours: { $sum: { $toDouble: "$working_hrs" } },
          total_minutes: { $sum: "$working_mins" },
          username: { $first: "$username" },
          total_month_submissions: { $sum: 1 },
          current_day_hours: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $dayOfMonth: "$working_date" }, currentDay] },
                    { $eq: [{ $year: "$working_date" }, currentYear] },
                    { $eq: [{ $month: "$working_date" }, currentMonth] }
                  ]
                },
                { $toDouble: "$working_hrs" },
                0
              ]
            }
          },
          current_day_minutes: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $dayOfMonth: "$working_date" }, currentDay] },
                    { $eq: [{ $year: "$working_date" }, currentYear] },
                    { $eq: [{ $month: "$working_date" }, currentMonth] }
                  ]
                },
                "$working_mins",
                0
              ]
            }
          },
          current_day_submissions: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $dayOfMonth: "$working_date" }, currentDay] },
                    { $eq: [{ $year: "$working_date" }, currentYear] },
                    { $eq: [{ $month: "$working_date" }, currentMonth] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $skip: (currentPage - 1) * limit
      },
      {
        $limit: limit
      },
      {
        $sort: { "working_date": -1 } // Sorting by working_date in descending order
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          total_hours: {
            $add: [
              "$total_hours",
              { $divide: ["$total_minutes", 60] }
            ]
          },
          username: 1,
          total_month_submissions: 1,
          current_day_hours: {
            $add: [
              "$current_day_hours",
              { $divide: ["$current_day_minutes", 60] }
            ]
          },
          current_day_submissions: 1
        }
      }
    ]);

    if (result.length === 0) {
      return res.status(404).json({
        message: "No work hours found for the specified month and year.",
      });
    }

    return res.status(200).json({
      message: "Users' total working hours for the month and current day fetched successfully!",
      data: result,
      month,
      year,
      totalItems: totalUsers,
      currentPage,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.error("Error calculating total work hours:", error);

    return res.status(500).json({
      message: "An error occurred while calculating total work hours.",
      error: error.message,
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
