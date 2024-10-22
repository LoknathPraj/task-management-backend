const { validationResult } = require("express-validator");
const Department = require("../model/department");
const Project = require("../model/project");
exports.AddDepartment = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Name should not be empty");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const name = req.body.name;

  const department = new Department({
    name: name,
  });
  department
    .save()
    .then((result) => {
      res.status(201).json({ message: "Department Added successfully!",data:result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.GetDepartment = async (req, res, next) => {
 let departmentIds= req?.body?.departmentIds
 
let query={}

if(Array.isArray(departmentIds)&&departmentIds?.length>0){
  query={ _id: { $in: departmentIds } }
}

  Department.find(query).populate('projects')
    .then((result) => {
      if (result) {
        res
          .status(200)
          .json({
            message: "Department list fetched successfullt",
            data: result,
          });
      } else {
        res
          .status(200)
          .json({ message: "Department list fetched successfullt", data: [] });
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};


  exports.deleteDepartment = async (req, res, next) => {
  try {
    let departmentId= req?.params?.departmentId
      console.log(departmentId)
      const department = await Department.findById(departmentId);
      if (!department) {
          return res
          .status(404)
          .json({ message: "Department not found"});
      }
      await Project.deleteMany({ department: departmentId });
      await Department.findByIdAndDelete(departmentId);
     return res
      .status(200)
      .json({ message: "Department deleted successfullt"});

  } catch (error) {
    return res
    .status(500)
    .json({ message: 'Error deleting department and projects:'+ error});
      
  }
}