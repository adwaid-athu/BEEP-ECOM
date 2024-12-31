const express = require("express");
const Router = express.Router();
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({ storage: storage });

const auth = require("../Middleware/adminAuth");

//Controllers
const adminController = require("../controller/admin/adminController");
const adminDashBoardController = require("../controller/admin/adminDashboard")
const adminCategoryController = require("../controller/admin/adminCategoryController");
const adminUsersController = require("../controller/admin/adminUsersController");
const adminBrandController = require("../controller/admin/adminBrandController");
const adminProductController = require("../controller/admin/adminProductController");
const adminOrderController = require("../controller/admin/adminOrderController")
const adminCouponController = require("../controller/admin/adminCouponController")
const offerController = require("../controller/admin/offerController");
const reportController = require("../controller/admin/reportController")


// Admin Authentication & Dashboard Routes
Router.get("/admin", auth.isAdminLoggedOut, adminController.loadAdminLogin);
Router.post("/admin", adminController.verifyAdmin);
Router.get("/admin/dashboard", auth.isAdminLoggedIn, (req, res) => {
  adminDashBoardController.loadDashboard(req, res, { currentPage: "dashboard" });
});
Router.get("/admin/dashboardUpdate",auth.isAdminLoggedIn,(req, res) => {
  adminDashBoardController.updateChart(req, res, { currentPage: "dashboard" });
});
Router.get("/adminLogout", auth.isAdminLoggedIn, (req, res) => {
  adminController.adminLogout(req, res, { currentPage: "" });
});

// Category Management Routes
Router.get("/admin/category", auth.isAdminLoggedIn, (req, res) => {
  adminCategoryController.loadAdminCategory(req, res, { currentPage: "category" });
});
Router.post("/admin/addCategory", auth.isAdminLoggedIn, adminCategoryController.addCategory);
Router.post("/admin/unlistCategory", auth.isAdminLoggedIn, adminCategoryController.unlistCategory);
Router.post("/admin/listCategory", auth.isAdminLoggedIn, adminCategoryController.listCategory);
Router.post("/admin/deleteCategory", auth.isAdminLoggedIn, adminCategoryController.deleteCategory);
Router.get("/admin/editCategory/:id", auth.isAdminLoggedIn, adminCategoryController.loadEditCategory);
Router.post("/admin/editCategorySave/:id", auth.isAdminLoggedIn, adminCategoryController.editCategory);

// User Management Routes
Router.get("/admin/users", auth.isAdminLoggedIn, (req, res) => {
  adminUsersController.loadAdminUsers(req, res, { currentPage: "users" });
});
Router.post("/admin/blockUser", auth.isAdminLoggedIn, adminUsersController.blockUser);
Router.post("/admin/unblockUser", auth.isAdminLoggedIn, adminUsersController.unblockUser);
Router.post("/admin/deleteUser", auth.isAdminLoggedIn, adminUsersController.deleteUser);

// Brand Management Routes
Router.get("/admin/brand", auth.isAdminLoggedIn, (req, res) => {
  adminBrandController.loadBrand(req, res, { currentPage: "brand" });
});
Router.post("/admin/addBrand", auth.isAdminLoggedIn, adminBrandController.addBrand);
Router.post("/admin/blockBrand", auth.isAdminLoggedIn, adminBrandController.blockBrand);
Router.post("/admin/unblockBrand", auth.isAdminLoggedIn, adminBrandController.unblockBrand);
Router.post("/admin/deleteBrand", auth.isAdminLoggedIn, adminBrandController.deleteBrand);
Router.get("/admin/editBrand/:id",auth.isAdminLoggedIn,adminBrandController.loadEditBrand)
Router.post("/admin/editBrand/:id",auth.isAdminLoggedIn,adminBrandController.EditBrand)


// Product Management Routes
Router.get("/admin/products", auth.isAdminLoggedIn, adminProductController.loadProduct);
Router.get("/admin/addProduct",auth.isAdminLoggedIn,adminProductController.loadAddProduct)
Router.post("/admin/addProduct",auth.isAdminLoggedIn,uploads.array('images',10),adminProductController.addProduct)
Router.post("/admin/deleteProduct",auth.isAdminLoggedIn,adminProductController.deleteProduct)
Router.post("/admin/blockProduct",auth.isAdminLoggedIn,adminProductController.blockProduct)
Router.post("/admin/unblockProduct",auth.isAdminLoggedIn,adminProductController.unblockProduct)
Router.get("/admin/editProduct/:id",auth.isAdminLoggedIn,adminProductController.loadEditProduct)
Router.post("/admin/editProduct/:id",auth.isAdminLoggedIn,uploads.array('images', 10),adminProductController.editProduct)

//Order Management Routes
Router.get("/admin/orders",auth.isAdminLoggedIn,adminOrderController.loadOrder)
Router.get("/admin/order/:id",auth.isAdminLoggedIn,adminOrderController.loadViewOrder)
Router.post("/admin/order/update/:id", auth.isAdminLoggedIn, adminOrderController.updateOrderStatus);
Router.post('/admin/cancelOrder',auth.isAdminLoggedIn,adminOrderController.cancelOrder);
Router.post('/admin/deleteOrder',auth.isAdminLoggedIn,adminOrderController.deleteOrder);

//Coupon Managment Routes
Router.get('/admin/coupon', auth.isAdminLoggedIn, adminCouponController.loadCouponsPage);
Router.get('/admin/coupon/add', auth.isAdminLoggedIn, adminCouponController.loadAddCouponPage);
Router.post('/admin/coupon/add', auth.isAdminLoggedIn, adminCouponController.createCoupon);
Router.get('/admin/coupon/update/:id', auth.isAdminLoggedIn, adminCouponController.loadUpdateCouponPage); 
Router.post('/admin/coupon/update/:id', auth.isAdminLoggedIn, adminCouponController.updateCoupon); 
Router.post('/admin/coupon/delete/:id', auth.isAdminLoggedIn, adminCouponController.deleteCoupon);
Router.post('/admin/coupon/deactivate/:id',auth.isAdminLoggedIn,adminCouponController.deactivateCoupon) 
Router.post('/admin/coupon/activate/:id',auth.isAdminLoggedIn,adminCouponController.activateCoupon) 

//Offer Managment Routes 
Router.get('/admin/offers',auth.isAdminLoggedIn,offerController.getOffers);
Router.get('/admin/offer/add',auth.isAdminLoggedIn,offerController.loadAddOffer)
Router.post('/admin/offer/add', offerController.addOffer);
Router.get('/admin/offer/update/:id',auth.isAdminLoggedIn, offerController.loadEditOffer);
Router.put('/admin/offer/update/:id', offerController.editOffer);
Router.post('/admin/offer/delete/:id', offerController.deleteOffer);
Router.post('/admin/offer/toggle/:id', offerController.toggleOffer);

//Sales Report Routes 

Router.get('/admin/report',auth.isAdminLoggedIn,reportController.loadReportPage)
Router.post('/admin/sales-report/pdf',auth.isAdminLoggedIn,reportController.downloadPDF);
Router.post('/admin/sales-report/excel',auth.isAdminLoggedIn,reportController.downloadExcel);

module.exports = Router;
