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

  router.get("/filterWorkLogByUserId/:userId", isAuth, workLogController.filterWorkLogByUserId);

  router.get("/getUserList", isAuth, workLogController.getUserList);


  router.get("/downloadExcel", workLogController.exportWorklog);
module.exports = router;
