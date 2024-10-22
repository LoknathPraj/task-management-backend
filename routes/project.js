const express = require('express');
const { body } = require('express-validator');
const { AddProject, GetProject,deleteProjectById } = require('../controllers/project');
// const { getProductByCatId } = require('../controllers/product');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.post('/',isAuth,[
    body("name").trim().isLength({min:2}),
    body("deptId").trim().isLength({min:1}),
], AddProject);


router.get('/:deptId',isAuth, GetProject);
router.get('/deleteProjectById/:projectId',isAuth, deleteProjectById);


module.exports = router;
