const User = require("../../Models/userSchema");
const Product = require("../../Models/productSchema")
const Category = require("../../Models/categorySchema")
const Brand = require("../../Models/brandSchema")
const express = require("express");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const { redirect, message } = require("statuses");
const { session } = require("passport");

const loadUserHome = async (req, res) => {
  try {

   const recent = await Product.find({}).sort({createdAt:-1}).limit(10).populate("category").populate("brand")

    res.render("home",{recent});
    req.session.otp = null;
  } catch (error) {
    console.log("page not found");
    res.status(500).send("server error");
  }
};


const loadShop = async (req, res) => {
  try {
      const { categories, brands, minPrice, maxPrice, sortby, page = 1, limit = 10, q } = req.query;

     
      const allCategories = await Category.find(); 
      const allBrands = await Brand.find(); 

      
      let filter = { isBlocked: false, status: "Available" };

      
      if (categories) {
          const categoryArray = Array.isArray(categories) ? categories : [categories];
          filter.category = { $in: categoryArray.map(id => id.toString().trim()).filter(Boolean) };
      }

      
      if (brands) {
          const brandArray = Array.isArray(brands) ? brands : [brands];
          const filteredBrands = brandArray.map(id => id.toString().trim()).filter(Boolean);
          filter.brand = { $in: filteredBrands };
      }

      
      if (minPrice || maxPrice) {
          filter.salePrice = {};
          if (minPrice) {
              filter.salePrice.$gte = Number(minPrice);
          }
          if (maxPrice) {
              filter.salePrice.$lte = Number(maxPrice);
          }
      }

      
      if (q) {
          filter.productName = { $regex: new RegExp(q, 'i') }; 
      }

      
      const totalProducts = await Product.countDocuments(filter);
      const totalPages = Math.ceil(totalProducts / limit);
      const offset = (page - 1) * limit;

     
      let products = await Product.find(filter)
          .populate("category brand")
          .skip(offset) 
          .limit(Number(limit)) 
          .lean();

      if (sortby === "low-to-high") {
          products.sort((a, b) => a.salePrice - b.salePrice);
      } else if (sortby === "high-to-low") {
          products.sort((a, b) => b.salePrice - a.salePrice);
      } else if (sortby === "a-z") {
          products.sort((a, b) => a.productName.localeCompare(b.productName));
      } else if (sortby === "z-a") {
          products.sort((a, b) => b.productName.localeCompare(a.productName));
      } else if (sortby === "new-arrivals") {
          products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortby === "old-arrivals") {
          products.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      res.render("shop", {
          products,
          categories: allCategories,
          brands: allBrands,
          selectedCategories: categories ? (Array.isArray(categories) ? categories : [categories]).map(id => id.trim()) : [],
          selectedBrands: brands ? (Array.isArray(brands) ? brands : [brands]).map(id => id.trim()) : [],
          priceMin: minPrice || 0,
          priceMax: maxPrice || 1000,
          sort: sortby || "",
          currentPage: Number(page),
          totalPages 
      });
  } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
  }
};



const loadProduct = async (req, res) => {
  try {
    const {productId} = req.query
    const product = await Product.findById(productId)
      .populate('brand')
      .populate('category')
      .exec();
    res.render('product', {product});
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}


module.exports = {
  loadUserHome,
  loadShop,
  loadProduct
};
