const express = require('express');

const feedController = require('../controllers/feed');
const {body}= require('express-validator');
const isAuth = require('../middleware/is-auth');
const router = express.Router();


// GET /feed/posts
router.get('/getFeeds',isAuth, feedController.getPosts);

// POST /feed/post
router.post('/create',isAuth,[
    body("title").trim().isLength({min:5}),
    body("content").trim().isLength({min:5}),
], feedController.createPost);


router.get('/post/:postId',isAuth, feedController.getPostById);
router.put('/updateFeedById/:postId',isAuth,
[
  body('title')
    .trim()
    .isLength({ min: 5 }),
  body('content')
    .trim()
    .isLength({ min: 5 })
], feedController.updatePostById);

router.delete('/deleteById/:postId',isAuth, feedController.deleteById);


module.exports = router;