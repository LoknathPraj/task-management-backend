const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../model/user");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  let departmentIds = req.body.departmentIds;
  const empId = req.body.empId;
  const password = req.body.password;
  const mobile = req.body.mobile;
  // const deptId = req.body.deptId;
  const designationId = req.body.designationId;
  const joiningDate = req.body.joiningDate;
  const adminId = req.body.adminId;

  if (!Array.isArray(departmentIds)) {
    departmentIds = [];
  }

  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const user = new User({
        email: email,
        password: hashedPw,
        name: name,
        mobile,
        // deptId,
        designationId,
        joiningDate,
        empId: empId,
        department: departmentIds,
        adminId,
      });
      if (req.body?.role) user.role = req.body.role;

      return user.save();
    })
    .then((result) => {
      res
        .status(201)
        .json({ message: "User created!", userId: result._id, data: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("A user with this email could not be found.");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong password!");
        error.statusCode = 401;
        throw error;
      }

      const adminId =
        loadedUser?.role === 10001 ? loadedUser?.id : loadedUser?.adminId;

      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
          adminId: adminId,
        },
        "somesupersecretsecret",
        { expiresIn: "98h" }
      );
      res.status(200).json({
        token: token,
        userId: loadedUser._id.toString(),
        user: loadedUser,
        adminId: adminId
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUserList = async (req, res, next) => {
  try {
    const currentPage = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 10;
    const adminId = req?.adminId;

    // Get total count of documents
    let count = await User.countDocuments({ adminId });

    // Fetch users in descending order (latest first)
    const users = await User.find({ adminId })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .select("-password");

    res.status(200).json({
      message: "User List fetched successfully!",
      data: users,
      currentPage,
      totalItems: count,
    });
  } catch (err) {
    next(err); // Pass the error to the error-handling middleware
  }
};

exports.deleteUserById = (req, res, next) => {
  const userId = req.params.userId;
  User.findById(userId)
    .then((user) => {
      if (!user) {
        const error = new Error("Could not find User.");
        error.statusCode = 404;
        throw error;
      }
      return User.findByIdAndRemove(userId);
    })
    .then((result) => {
      return res
        .status(200)
        .json({ message: "User Deleted successfully", data: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateUserById = async (req, res, next) => {
  const name = req.body.name;
  const password = req.body.password;
  const mobile = req.body.mobile;
  const deptId = req.body.deptId;
  const designationId = req.body.designationId;
  const joiningDate = req.body.joiningDate;

  let hashedPw = "";
  if (password) {
    hashedPw = await bcrypt.hash(password, 12).then((hashedPw) => hashedPw);
  }

  const userId = req.params.userId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  User.findById(userId)
    .then((user) => {
      if (!user) {
        const error = new Error("Could not find user.");
        error.statusCode = 404;
        throw error;
      }
      user.password = hashedPw || user.password;
      user.name = name;
      user.mobile = mobile;
      user.deptId = deptId;
      user.designationId = designationId;
      user.joiningDate = joiningDate;
      return user.save();
    })
    .then((result) => {
      res
        .status(200)
        .json({ message: "User updated successfully!", worklog: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
