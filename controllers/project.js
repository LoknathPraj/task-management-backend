const { validationResult } = require("express-validator");
const Project = require("../model/project");

exports.AddProject = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Name should not be empty");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const name = req.body.name;
  const deptId=req.body.deptId
  const project = new Project({
    name: name,
    department:deptId
  });
  project
    .save()
    .then((result) => {
      res.status(201).json({ message: "Project Added successfully!",data:result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.GetProject = (req, res, next) => {
  // const deptId= req?.body?.deptId||null
  const deptId = req.params.deptId;
  Project.find({department:deptId})
    .then((result) => {
      if (result) {
        res
          .status(200)
          .json({
            message: "Project list fetched successfullt",
            data: result,
          });
      } else {
        res
          .status(200)
          .json({ message: "Project list fetched successfullt", data: [] });
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};


exports.deleteProjectById = async (req, res, next) => {
  try {
    let projectId= req?.params?.projectId
      const project = await Project.findById(projectId);
      if (!project) {
          return res
          .status(404)
          .json({ message: "Project not found"});
      }
      // await Project.deleteMany({ department: departmentId });
      await Project.findByIdAndDelete(projectId);
     return res
      .status(200)
      .json({ message: "Project deleted successfullt"});

  } catch (error) {
    return res
    .status(500)
    .json({ message: 'Error deleting Project:'+ error});
      
  }
}