const { validationResult } = require("express-validator");
const Post = require("../model/post");
const fs = require('fs');
const path = require('path');
const User =require('../model/user');


exports.getPosts = async(req, res, next) => {
  const currentPage=req.query.page||1;
  const perPage=3
  // let totalItems;
 let count = await Post.find().countDocuments()

 Post.find().skip((currentPage-1)*perPage).limit(perPage)
    .then((result) => {
   
      res.status(201).json({
        message: "Post fectech successfully!",
        totalItems:count,
        post: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
let creator;
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });
  post
    .save()
    .then(result=>{
      return User.findById(req.userId)
    })
    .then((user) => {
      creator=user
      user.posts.push(post)
      return user.save();
    })
    .then((result)=>{
      res.status(201).json({
        message: "Post created successfully!",
        post: post,
        creator:{_id:creator._id,name:creator.name}
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPostById = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((result) => {
      if (!result) {
        const error = new Error("Data Not found.");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Post fetched.", post: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};



exports.updatePostById = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if(post.creator.toString() !== req.userId){
        const error = new Error('Not Authorized.');
        error.statusCode = 403;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Post updated!', post: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};


exports.deleteById=(req,res,next)=>{
const postId=req.params.postId

Post.findById(postId).then(post=>{
  if(!post){
    const error = new Error('Could not find post.');
    error.statusCode = 404;
    throw error;
  }
  if(post.creator.toString() !== req.userId){
    const error = new Error('Not Authorized.');
    error.statusCode = 403;
    throw error;
  }
  clearImage(post.imageUrl)
 return Post.findByIdAndRemove(postId)

})
.then(result=>{
return User.findById(req.userId)
})
.then(user=>{
  user.posts.pull(postId);
  return user.save()
})
.then(result=>{
  return res.status(200).json({message:"Post Deleted successfully",data:result})
})

.catch(err=>{
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  next(err);
})
}