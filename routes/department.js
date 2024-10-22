const express = require('express');
const { body } = require('express-validator');
const { AddDepartment, GetDepartment,deleteDepartment } = require('../controllers/department');
// const { getProductByCatId } = require('../controllers/product');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.post('/',isAuth,[
    body("name").trim().isLength({min:2}),

], AddDepartment);


router.post('/getDepartmentbyIds',isAuth, GetDepartment);

router.get('/deleteDepartmentById/:departmentId',isAuth, deleteDepartment);



module.exports = router;
