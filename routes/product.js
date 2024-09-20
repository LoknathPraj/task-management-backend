const express = require('express');
const productController = require('../controllers/product');
const {body}= require('express-validator');
const isAuth = require('../middleware/is-auth');
const router = express.Router();

router.post('/add-product',isAuth,[
    body("title").trim().isLength({min:5}),
    body("description").trim(),
    body('price').trim().isLength({min:1}),
    body('category_id').trim().isLength({min:5})
], productController.AddProduct);

router.get('/products',isAuth,productController.getProduct)

router.post('/productByCategoryId',isAuth,[
    body("category_id").trim().isLength({min:5}),
], productController.getProductByCatId);



router.post('/productDetails',isAuth,[
    body("product_id").trim().isLength({min:5}),
], productController.productDetails);





module.exports = router;