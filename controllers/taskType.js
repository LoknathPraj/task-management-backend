const { validationResult } = require("express-validator");
const TaskType = require("../model/taskType");

exports.AddTaskType = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Name & Project should not be empty");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const name = req.body.name;
  const taskType = new TaskType({
    name: name,
    projectId:req.body.projectId,
    adminId: req.adminId,
    projectName:req.body.projectName

  });
  taskType
    .save()
    .then((result) => {
      res.status(201).json({ message: "Task Type Added successfully!",data:result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.GetTaskTypeList = (req, res, next) => {
  // const deptId= req?.body?.deptId||null
  const projectId = req.params.projectId;
  TaskType.find({projectId:projectId})
    .then((result) => {
      if (result) {
        res
          .status(200)
          .json({
            message: "Task Type list fetched successfullt",
            data: result,
          });
      } else {
        res
          .status(200)
          .json({ message: "Task Type list fetched successfullt", data: [] });
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};


exports.deleteTaskTypeById = async (req, res, next) => {
  try {
    let taskTypeId= req?.params?.taskTypeId
      const taskType = await TaskType.findById(taskTypeId);
      if (!taskType) {
          return res
          .status(404)
          .json({ message: "Task Type not found"});
      }
      // await Project.deleteMany({ department: departmentId });
      await TaskType.findByIdAndDelete(taskTypeId);
     return res
      .status(200)
      .json({ message: "Task Type deleted successfullt"});

  } catch (error) {
    return res
    .status(500)
    .json({ message: 'Error deleting Project:'+ error});
      
  }
}

exports.GetAllTaskTypeList = async (req, res, next) => {
  TaskType.find({adminId:req.adminId})
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Task Type list fetched successfullt",
          data: result,
        });
      } else {
        res
          .status(200)
          .json({ message: "Task Type list fetched successfullt", data: [] });
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};