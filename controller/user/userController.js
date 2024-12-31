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
const mongoose = require("mongoose")

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
    const {
      categories,
      brands,
      minPrice,
      maxPrice,
      sortby,
      page = 1,
      limit = 10,
      q,
    } = req.query;

    const allCategories = await Category.find();
    const allBrands = await Brand.find();

    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let filter = { isBlocked: false, status: 'Available' };

    if (categories) {
      const categoryArray = Array.isArray(categories) ? categories : [categories];
      const validCategories = categoryArray
        .map((id) => id.trim())
        .filter(Boolean)
        .filter(isValidObjectId);
      if (validCategories.length > 0) {
        filter.category = { $in: validCategories };
      }
    }

    if (brands) {
      const brandArray = Array.isArray(brands) ? brands : [brands];
      const validBrands = brandArray
        .map((id) => id.trim())
        .filter(Boolean)
        .filter(isValidObjectId);
      if (validBrands.length > 0) {
        filter.brand = { $in: validBrands };
      }
    }

    if (minPrice || maxPrice) {
      filter.salePrice = {};
      if (minPrice) filter.salePrice.$gte = Number(minPrice);
      if (maxPrice) filter.salePrice.$lte = Number(maxPrice);
    }

    if (q) {
      filter.productName = { $regex: new RegExp(escapeRegex(q), 'i') };
    }

    // Log the filter for debugging
    console.log('Constructed Filter:', filter);

    // Pagination setup
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    const offset = (page - 1) * limit;

    const sortOptions = {
      'low-to-high': { salePrice: 1 },
      'high-to-low': { salePrice: -1 },
      'a-z': { productName: 1 },
      'z-a': { productName: -1 },
      'new-arrivals': { createdAt: -1 },
      'old-arrivals': { createdAt: 1 },
    };
    const sort = sortOptions[sortby] || {};

    const products = await Product.find(filter)
      .populate({
        path: 'brand',
        populate: { path: 'offer', model: 'Offer' },
      })
      .populate({
        path: 'category',
        populate: { path: 'offer', model: 'Offer' },
      })
      .populate({
        path: 'offer',
        model: 'Offer',
      })
      .sort(sort) 
      .skip(offset)
      .limit(Number(limit))
      .lean()
      .exec();

    console.log('Retrieved Products:', products);

    res.render('shop', {
      products,
      categories: allCategories,
      brands: allBrands,
      selectedCategories: categories
        ? Array.isArray(categories)
          ? categories.map((id) => id.trim())
          : [categories.trim()]
        : [],
      selectedBrands: brands
        ? Array.isArray(brands)
          ? brands.map((id) => id.trim())
          : [brands.trim()]
        : [],
      priceMin: minPrice || '',
      priceMax: maxPrice || '',
      sort: sortby || '',
      currentPage: Number(page),
      totalPages,
    });
  } catch (error) {
    console.error('Error in loadShop:', error);
    res.status(500).send('Server Error');
  }
};

const loadProduct = async (req, res) => {
  try {
    const {productId} = req.query
    const product = await Product.findById(productId)
    .populate({
      path: 'brand', 
      populate: {
        path: 'offer', 
        model: 'Offer'
      }
    })
    .populate({
      path: 'category', 
      populate: {
        path: 'offer', 
        model: 'Offer'
      }
    })
    .populate({
      path: 'offer', 
      model: 'Offer'
    })
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
