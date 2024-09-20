const { validationResult } = require("express-validator");
const Product = require("../model/product");
const Category = require("../model/category");
exports.getProduct = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 30;
  let count = await Product.find().countDocuments();
  //  Product.aggregate([
  //     { $lookup:
  //         {
  //            from: "Category",
  //            localField: "category_id",
  //            foreignField: "_id",
  //            as: "category"
  //         }
  //     }
  // ])
  Product.find()
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .then((result) => {
      res.status(201).json({
        message: "Product fetech successfully!",
        totalItems: count,
        data: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.AddProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const description = req.body.description;
  const price = req.body.price;
  const category_id = req.body.category_id;

  const product = new Product({
    title: title,
    description: description,
    imageUrl: imageUrl,
    price: price,
    category_id: category_id,
  });
  product
    .save()
    .then((result) => {
      res.status(201).json({
        message: "Product added successfully!",
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

exports.getProductByCatId = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const category_id = req.body.category_id;

  const perPage = 30;
  let count = await Product.find({ category_id: category_id }).countDocuments();
  Product.find({ category_id: category_id })
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .then((result) => {
      res.status(201).json({
        message: "Product fetech successfully!",
        totalItems: count,
        data: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.productDetails = async (req, res, next) => {
  let product;
  const product_id = req.body.product_id;
  Product.findById(product_id)
    .then((result) => {
      if (result) {
        product = result;
        return Category.findById(result.category_id);
      }
    })
    .then((category) => {
      product.category_title = category.title;
      console.log(product);
      res.status(200).json({
        message: "Product fetech successfully!",
        data: { product: product, category: category.title },
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
