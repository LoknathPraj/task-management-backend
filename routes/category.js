const express = require('express');
const { body } = require('express-validator');
const { AddCategory, GetCategory } = require('../controllers/category');
const { getProductByCatId } = require('../controllers/product');
const isAuth = require('../middleware/is-auth');

const router = express.Router();


router.post('/category',isAuth,[
    body("title").trim().isLength({min:5}),
], AddCategory);


router.get('/category',isAuth, GetCategory);


module.exports = router;
