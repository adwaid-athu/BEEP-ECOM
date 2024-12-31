const express = require("express");
const router = express.Router();
const auth = require("../Middleware/auth");
const passport = require("passport");

///////////////////////////Controllers//////////////////////////

const userController = require("../controller/user/userController");
const LoginRegisterController = require("../controller/user/LoginRegisterController")
const cartController = require("../controller/user/cartController");
const dashboardController = require("../controller/user/dashBoardController");
const checkoutController = require("../controller/user/checkoutController");
const wishlistController = require("../controller/user/wishlistController")
const { message } = require("statuses");

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

// Callback route to handle Google OAuth response
router.get(
  "/auth/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { failureRedirect: "/login" }, (err, user, info) => {
      if (err) {
        // Pass any errors to the next middleware for handling
        return next(err);
      }
      if (!user) {
        // Redirect to login with an optional message if authentication failed
        return res.redirect(`/login?message=${encodeURIComponent(info?.message || "Authentication failed")}`);
      }
      // Log the user in and store their details in session
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        // Store user details in session and redirect to home
        req.session.user = user._id;
        return res.redirect("/");
      });
    })(req, res, next);
  }
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
router.get("/cart",auth.isLoggedIn,auth.isBlocked, cartController.loadCart);
router.post("/addToCart/:productId", cartController.addToCart);
router.post('/updateQuantity', cartController.updateQuantity);
router.post('/removeItem', cartController.removeItem);
router.post("/applyCoupon",cartController.applyCoupon)
router.post("/removeCoupon",cartController.removeCoupon)

/////////////////////////////DashBoard////////////////////////////////
router.get("/dashboard",auth.isLoggedIn,auth.isBlocked,auth.isBlocked,dashboardController.loadDashBoard);
router.get("/userEdit", auth.isLoggedIn,auth.isBlocked, dashboardController.loadEditUser);
router.post("/updateUser", auth.isLoggedIn,auth.isBlocked, dashboardController.updateUser);
router.get("/passwordReset",auth.isLoggedIn,auth.isBlocked,dashboardController.loadPasswordReset);
router.post("/saveNewPassword",dashboardController.saveNewPassword);
router.get('/viewOrder/:id',auth.isLoggedIn,auth.isBlocked,dashboardController.viewOrder)
router.post('/cancel/:id', dashboardController.cancelOrder);
router.post('/return/:id', dashboardController.returnOrder);
router.post('/invoiceDownload/:id',dashboardController.downloadInvoice)


//////////////////////////Address Managment//////////////////////////////////////
router.get("/addAddress",auth.isLoggedIn,auth.isBlocked,dashboardController.loadAddAddressPage)
router.post("/saveNewAddress",auth.isLoggedIn,auth.isBlocked,dashboardController.saveNewAddress)
router.get("/editAddress/:addressNo",auth.isLoggedIn,auth.isBlocked,dashboardController.loadEditAddress)
router.post("/editAddress",auth.isLoggedIn,auth.isBlocked,dashboardController.editAddress)
router.delete("/addressDelete/:addressNo",dashboardController.deleteAddress)
//////////////////////////////Checkout/////////////////////////////////////////
router.get("/checkout",auth.isLoggedIn,auth.isBlocked,checkoutController.loadCheckout)
router.post("/placeOrder",auth.isLoggedIn,auth.isBlocked, checkoutController.placeOrder)
router.get("/orderSuccess",auth.isLoggedIn,auth.isBlocked,checkoutController.loadOrderSuccess)
////////////////////////////wishlist/////////////////////////////
router.get("/wishlist",auth.isLoggedIn,auth.isBlocked,wishlistController.loadWishlist)
router.post("/addToWishlist/:id",wishlistController.addToWishlist)
router.delete("/removeWishlist",wishlistController.removeFromWishlist)

module.exports = router;
