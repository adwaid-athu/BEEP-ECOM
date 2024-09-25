const express = require("express");
const Router = express.Router();
const adminController = require("../controller/admin/adminController");
const adminCategoryController = require("../controller/admin/adminCategoryController");
const adminUsersController = require("../controller/admin/adminUsersController");
const adminbrandController = require("../controller/admin/adminBrandController");
const auth = require("../Middleware/adminAuth");
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({ storage: storage });

Router.get("/admin", auth.isAdminLoggedOut, adminController.loadAdminLogin);
Router.post("/admin", adminController.verifyAdmin);

Router.get("/admin/dashboard", auth.isAdminLoggedIn, (req, res) => {
  adminController.loadAdminDashboard(req, res, { currentPage: "dashboard" });
});

Router.get("/admin/brand", auth.isAdminLoggedIn, (req, res) => {
  adminbrandController.loadBrand(req, res, {
    currentPage: "brand",
  });
});

  Router.get("/admin/category", auth.isAdminLoggedIn, (req, res) => {
  adminCategoryController.loadAdminCategory(req, res, {
    currentPage: "category",
  });
});

Router.get("/admin/users", auth.isAdminLoggedIn, (req, res) => {
  adminUsersController.loadAdminUsers(req, res, { currentPage: "users" });
});

Router.get("/adminLogout", auth.isAdminLoggedIn, (req, res) => {
  adminController.adminLogout(req, res, { currentPage: "" });
});

Router.get(
  "/admin/editCategory/:id",
  auth.isAdminLoggedIn,
  adminCategoryController.loadEditCategory
);

Router.post(
  "/admin/blockUser",
  auth.isAdminLoggedIn,
  adminUsersController.blockUser
);
Router.post(
  "/admin/unblockUser",
  auth.isAdminLoggedIn,
  adminUsersController.unblockUser
);
Router.post(
  "/admin/deleteUser",
  auth.isAdminLoggedIn,
  adminUsersController.deleteUser
);
Router.post(
  "/admin/addCategory",
  auth.isAdminLoggedIn,
  adminCategoryController.addCategory
);
Router.post(
  "/admin/unlistCategory",
  auth.isAdminLoggedIn,
  adminCategoryController.unlistCategory
);
Router.post(
  "/admin/listCategory",
  auth.isAdminLoggedIn,
  adminCategoryController.listCategory
);
Router.post(
  "/admin/deleteCategory",
  auth.isAdminLoggedIn,
  adminCategoryController.deleteCategory
);
Router.post(
  "/admin/editCategorySave/:id",
  auth.isAdminLoggedIn,
  adminCategoryController.editCategory
);

Router.post("/admin/addBrand",auth.isAdminLoggedIn,adminbrandController.addBrand)

module.exports = Router;
