const express = require("express");
const router = express.Router();
const auth = require("../Middleware/auth");
const passport = require("passport");

///////////////////////////Controllers//////////////////////////

const userController = require("../controller/user/userController");
const LoginRegisterController = require("../controller/user/LoginRegisterController")
const cartController = require("../controller/user/cartController");
const dashboardController = require("../controller/user/dashBoardController");
const checkoutController = require("../controller/user/checkoutController")

////////////////////Main Pages Routes////////////////////

router.get("/", userController.loadUserHome);
router.get("/shop", userController.loadShop);
router.get("/product", userController.loadProduct);

//////////////////////Regiter//Login//Logout//////////////////

router.get("/login", auth.isLoggedOut, LoginRegisterController.loadUserLogin);
router.get("/register", auth.isLoggedOut, LoginRegisterController.loadUserRegister);
router.get("/otp", auth.OTPcheck, LoginRegisterController.loadOtp);
router.get("/resetForgotPassword",auth.OTPcheck,LoginRegisterController.loadResetForgotPassword)


router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
function storeUserIdInSession(req, res) {
  if (req.user) {
    req.session.user = req.user._id;
    req.session.userName = req.user.name;
    res.redirect("/")
  }
}
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/register" }),
  storeUserIdInSession
);


router.get("/logout", LoginRegisterController.logout);
router.get("/forgotPassword",LoginRegisterController.loadForgotPassword)

router.post("/register", LoginRegisterController.userRegister);
router.post("/otpPage", LoginRegisterController.verifyOtp);
router.post("/login", LoginRegisterController.userLogin);
router.post("/resendOtp", LoginRegisterController.resendOtp);
router.post("/forgotPassword",LoginRegisterController.forgotPassword)
router.post("/newPassword",LoginRegisterController.resetForgotPassword)

///////////////////////////////Cart////////////////////////////////////
router.get("/cart", auth.isLoggedIn, cartController.loadCart);
router.post("/addToCart/:productId", cartController.addToCart);
router.post('/updateQuantity', cartController.updateQuantity);
router.post('/removeItem', cartController.removeItem);

/////////////////////////////DashBoard////////////////////////////////
router.get("/dashboard", auth.isLoggedIn, dashboardController.loadDashBoard);
router.get("/userEdit", auth.isLoggedIn, dashboardController.loadEditUser);
router.post("/updateUser", auth.isLoggedIn, dashboardController.updateUser);
router.get("/passwordReset",auth.isLoggedIn,dashboardController.loadPasswordReset);
router.post("/saveNewPassword",auth.isLoggedIn,dashboardController.saveNewPassword);
router.get('/viewOrder/:id',auth.isLoggedIn,dashboardController.viewOrder)
router.post('/cancel/:id', dashboardController.cancelOrder);


//////////////////////////Address Managment//////////////////////////////////////
router.get("/addAddress",auth.isLoggedIn,dashboardController.loadAddAddressPage)
router.post("/saveNewAddress",auth.isLoggedIn,dashboardController.saveNewAddress)
router.get("/editAddress/:addressNo",auth.isLoggedIn,dashboardController.loadEditAddress)
router.post("/editAddress",auth.isLoggedIn,dashboardController.editAddress)
router.delete("/addressDelete/:addressNo",dashboardController.deleteAddress)
//////////////////////////////Checkout/////////////////////////////////////////
router.get("/checkout",auth.isLoggedIn,checkoutController.loadCheckout)
router.post("/placeOrder",auth.isLoggedIn, checkoutController.placeOrder)
router.get("/orderSuccess",auth.isLoggedIn,checkoutController.loadOrderSuccess)
module.exports = router;
