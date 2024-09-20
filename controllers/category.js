const { validationResult } = require("express-validator");
const Category = require("../model/category");

exports.AddCategory = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("title  must be atleast length of  5 characters");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const title = req.body.title;
  const category = new Category({
    title: title,
  });

  category
    .save()
    .then((result) => {
      res.status(201).json({ message: "Category Added successfully!" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.GetCategory = (req, res, next) => {
  Category.find()
    .then((result) => {
      if (result) {
        res
          .status(200)
          .json({
            message: "Category list fetched successfullt",
            data: result,
          });
      } else {
        res
          .status(200)
          .json({ message: "Category list fetched successfullt", data: [] });
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
