const express = require("express");
const Router = express.Router();
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({ storage: storage });

const auth = require("../Middleware/adminAuth");

const adminController = require("../controller/admin/adminController");
const adminCategoryController = require("../controller/admin/adminCategoryController");
const adminUsersController = require("../controller/admin/adminUsersController");
const adminBrandController = require("../controller/admin/adminBrandController");
const adminProductController = require("../controller/admin/adminProductController");

// Admin Authentication & Dashboard Routes
Router.get("/admin", auth.isAdminLoggedOut, adminController.loadAdminLogin);
Router.post("/admin", adminController.verifyAdmin);
Router.get("/admin/dashboard", auth.isAdminLoggedIn, (req, res) => {
  adminController.loadAdminDashboard(req, res, { currentPage: "dashboard" });
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

// Product Management Routes
Router.get("/admin/products", auth.isAdminLoggedIn, adminProductController.loadProduct);
Router.get("/admin/addProduct",auth.isAdminLoggedIn,adminProductController.loadAddProduct)
Router.post("/admin/addProduct",auth.isAdminLoggedIn,uploads.array("images"),adminProductController.addProduct)
Router.post("/admin/deleteProduct",auth.isAdminLoggedIn,adminProductController.deleteProduct)
Router.post("/admin/blockProduct",auth.isAdminLoggedIn,adminProductController.blockProduct)
Router.post("/admin/unblockProduct",auth.isAdminLoggedIn,adminProductController.unblockProduct)
Router.get("/admin/editProduct/:id",auth.isAdminLoggedIn,adminProductController.loadEditProduct)
Router.post("/admin/editProduct/:id",auth.isAdminLoggedIn,adminProductController.editProduct)
// Export Router
module.exports = Router;
