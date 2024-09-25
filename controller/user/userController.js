const User = require("../../Models/userSchema");
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
    res.render("home");
    req.session.otp = null;
  } catch (error) {
    console.log("page not found");
    res.status(500).send("server error");
  }
};

const loadUserLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log("page not found");
    res.status(500).send("server error");
  }
};
const loadUserRegister = async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log("page not found");
    res.status(500).send("server error");
  }
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "OTP for your account verification",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP:${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email", error);
    return false;
  }
}

const userRegister = async (req, res) => {
  const { name, email, phone, password } = req.body;

  const findUser = await User.findOne({ email });

  if (findUser) {
    return res.status(400).json({ message: "User Already Exists" });
  } else {
    const otp = generateOtp();

    req.session.otp = otp;
    req.session.temp = { name, email, phone, password };

    sendVerificationEmail(email, otp);
    console.log("OTP:" + otp);

    return res.status(200).json({ success: true });
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    return passwordHash;
  } catch (error) {}
};
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    

    console.log(req.body);

    if (otp === req.session.otp) {
      req.session.userData = req.session.temp;
      const user = req.session.temp;
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User data is missing from session",
        });
      }

      const passwordHash = await securePassword(user.password);

      const saveUserData = new User({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: passwordHash,
      });
      await saveUserData.save();

      req.session.user = saveUserData._id;
      return res.status(200).json({ success: true });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again." });
    }
  } catch (error) {
    console.error("Error Verifying OTP", error);
    return res
      .status(500)
      .json({ success: false, message: "An error occurred" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.temp;
    const newOtp = generateOtp();

    req.session.otp = newOtp;

    sendVerificationEmail(email, newOtp);
    console.log("new OTP:" + newOtp);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("OTP resend failed", error);
    return res
      .status(500)
      .json({ message: "OTP resend failed please try again later" });
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    if (userData) {
      const isMatch = await bcrypt.compare(password, userData.password);

      if (isMatch) {
        if(userData.isBlocked==false){
        req.session.user = userData._id;
        return res.status(200).json({ success: true });
        }else{
          return res.status(400).json({message:"User Is Blocked"})
        }
      } else {
        return res.status(400).json({ message: "Check your Password" });
      }
    } else {
      return res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const loadDashBoard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (error) {
    console.error("Error loading Dashboard", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
const loadOtp = async (req, res) => {
  try {
    res.render("otpPage");
  } catch (error) {
    console.log("otp page error", error);
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Failed to destroy session:", err);
      return res.status(500).send("Failed to destroy session");
    }

    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};

module.exports = {
  loadUserHome,
  loadUserLogin,
  loadUserRegister,
  userRegister,
  verifyOtp,
  userLogin,
  loadDashBoard,
  resendOtp,
  loadOtp,
  logout,
};
