const express = require("express");
const { body } = require("express-validator");

const User = require("../model/user");
const authController = require("../controllers/auth");
const isAuth = require("../middleware/is-auth");
const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("E-Mail address already exists!");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().not().isEmpty(),
  ],
  authController.signup
);

router.post("/login", authController.login);
router.get("/getUserList", isAuth, authController.getUserList);
router.get("/deleteUserById/:userId", isAuth, authController.deleteUserById);
router.post("/updateUserById/:userId", isAuth, authController.updateUserById);

module.exports = router;
