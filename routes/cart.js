const express = require('express');
const { body } = require('express-validator');
const isAuth = require('../middleware/is-auth');
const cartController = require('../controllers/cart');

const router = express.Router();


router.post('/add',isAuth, cartController.addCartItem);
router.get('/getCartItems',isAuth, cartController.getCartItem);



module.exports = router;
