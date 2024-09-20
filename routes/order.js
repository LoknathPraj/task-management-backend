const express = require('express');
const { body } = require('express-validator');
const isAuth = require('../middleware/is-auth');
const orderController = require('../controllers/order');

const router = express.Router();


router.post('/placeOrder',isAuth,[
    body("mobile").trim().isLength({min:10}),
    body("email").trim().isEmail(),
    body('username').trim().isLength({min:5}),
    body('delivery_address').trim().isLength({min:5}),
   
], orderController.placeOrder);
router.get('/getOrders',isAuth, orderController.getOrders);



module.exports = router;
