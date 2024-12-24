const express = require('express');
const { body } = require('express-validator');

// const { getProductByCatId } = require('../controllers/product');
const isAuth = require('../middleware/is-auth');
const { AddTaskType, GetAllTaskTypeList, GetTaskTypeList, deleteTaskTypeById } = require('../controllers/taskType');

const router = express.Router();

router.post('/',isAuth,[
    body("name").trim().isLength({min:2}),
    body("projectId").trim().isLength({min:1}),
], AddTaskType);
router.get('/:projectId',isAuth,GetTaskTypeList);
router.get('/deleteTaskTypeById/:taskTypeId',isAuth, deleteTaskTypeById);
router.get('/',isAuth, GetAllTaskTypeList);



module.exports = router;
