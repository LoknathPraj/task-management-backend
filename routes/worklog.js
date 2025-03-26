const express = require("express");
const workLogController = require("../controllers/worklog");
const { body } = require("express-validator");
const isAuth = require("../middleware/is-auth");
const router = express.Router();
router.post(
  "/add-worklog",
  isAuth,
  [
    body("project_name").notEmpty().withMessage("Project Name is required"),
    body("task_type").notEmpty().withMessage("Tasks is required"),
    body("working_hrs").notEmpty().withMessage("Working hrs is required"),
    body("working_date").notEmpty().withMessage("Working Date is required"),
    body("location").notEmpty().withMessage("Location is required"),
    body("task_description").notEmpty().withMessage("Description is required"),
    body("username").notEmpty().withMessage("Username is required"),
  ],
  workLogController.AddWorklog
);
// body('username').notEmpty().withMessage('Username is required'),
// body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
router.get("/getAllWorklog", isAuth, workLogController.getAllWorkLog);
router.get("/getTodaysWorklog", isAuth, workLogController.getTodaysWorkLog);
router.get("/getWorkLogByUserId", isAuth, workLogController.getWorkLogByUserId);
router.get(
  "/deleteByWorklogId/:workLogId",
  isAuth,
  workLogController.deleteWorkLogById
);

router.post(
  "/updateWorklogById/:workLogId",
  isAuth,
  workLogController.updateWorklogById
);
router.get(
  "/filterWorkLogByUserId/:userId",
  isAuth,
  workLogController.filterWorkLogByUserId
);

router.get("/downloadExcel", workLogController.exportWorklog);

router.get("/getTotalWorkHoursForMonth", async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const totalHours = await workLogController?.getTotalWorkHoursForMonth(parseInt(month), parseInt(year));
    res.json({ monthly_statistics: totalHours });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/getYearlyWorkHours", async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ message: "Year are required" });
    }

    const yearlyWorkData = await workLogController?.getYearlyWorkHours(parseInt(year));
    res.json({ yearly_Statistics: yearlyWorkData });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



router.get("/getAllUsersTotalWorkHoursForMonthAndDay", workLogController.getAllUsersTotalWorkHoursForMonthAndDay);
module.exports = router;
