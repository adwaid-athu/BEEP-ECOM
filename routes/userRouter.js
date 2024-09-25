const express = require("express")
const router = express.Router()
const userController = require("../controller/user/userController")
const auth= require("../Middleware/auth")
const passport = require("passport")

router.get("/",userController.loadUserHome)
router.get("/login",auth.isLoggedOut,userController.loadUserLogin)
router.get("/register",auth.isLoggedOut,userController.loadUserRegister)
router.get("/dashboard",auth.isLoggedIn,userController.loadDashBoard)
 router.get("/OTP",auth.OTPcheck,userController.loadOtp)
router.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}));
function storeUserIdInSession(req, res) {
    if (req.user) {
        req.session.user = req.user._id;
        req.session.userName=req.user.name;
        res.redirect('/');
    }} 
router.get("/auth/google/callback",passport.authenticate("google",{failureRedirect:"/register"}),storeUserIdInSession)
router.get("/logout",userController.logout)


router.post("/register",userController.userRegister)
router.post("/otpPage",userController.verifyOtp)
router.post("/login",userController.userLogin)
router.post("/resendOtp",userController.resendOtp)


module.exports = router

