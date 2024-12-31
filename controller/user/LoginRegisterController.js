const User = require("../../Models/userSchema");
const express = require("express");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const { redirect, message } = require("statuses");
const { session } = require("passport");

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
    //For Registering New User
    if (otp === req.session.otp&&req.session.temp) {
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
      res.status(200).json({ success: true,redirectUrl:"/" })

    } 
    
    else if(otp === req.session.otp&&req.session.passwordForgotUser){
      res.status(200).json({success:true,redirectUrl:"/resetForgotPassword"})
    }
    else {
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
    const { email } = req.session.temp||req.session.passwordForgotUser;
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
        if (userData.isBlocked == false) {
          req.session.user = userData._id;
          return res.status(200).json({ success: true });
        } else {
          return res.status(400).json({ message: "User Is Blocked" });
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

const loadOtp = async (req, res) => {
  try {
    res.render("otpPage");
  } catch (error) {
    console.log("otp page error", error);
  }
};

const logout = async (req, res) => {
  await req.session.destroy((err) => {
      if (err) {
          console.error("Failed to destroy session:", err);
          return res.status(500).send("Failed to destroy session");
      }
      res.clearCookie("connect.sid", { 
          path: '/', 
          httpOnly: true,
          secure: false,
          expires: new Date(0)
      });

      res.clearCookie("ext_name", { path: '/', expires: new Date(0) });

      res.redirect("/login");
  });
};



const loadForgotPassword = async(req,res)=>{
    try {
        res.render("forgotPassword")
    } catch (error) {
        res.status(500)
        console.error(error,"Error Loading ForgotPassword");
    }
}


const forgotPassword = async (req,res)=>{
    try {
        const email = req.body.email

        const user = await User.findOne({email:email})

        if(!user){
            res.status(400).json({message:"No User With This Email"})
        }else{
            const otp = generateOtp()
            req.session.otp = otp
            req.session.passwordForgotUser=user
            sendVerificationEmail(email, otp);
            console.log("OTP:" + otp);
             res.status(200).json({success:true}) 
        }
    } catch (error) {
      res.status(500)
      console.error(error);
    } 
}

const loadResetForgotPassword = async(req,res)=>{
  try {
    res.render("resetForgotPassword")
  } catch (error) {
    res.status(500)
    console.error(error,"Error in loading resetForgotPassword page")
  }
}
const resetForgotPassword = async(req,res)=>{
  try {
    const securedNewPassword = await securePassword(req.body.newPassword)
    const user = req.session.passwordForgotUser
    const update = await User.updateOne({_id:user._id},{password:securedNewPassword})
    if(update){
      res.status(200).json({success:true})
    }
  } catch (error) {
  res.status(500)
  console.error(error,"Error in resetting")
  }
}

module.exports = {
  loadUserLogin,
  loadUserRegister,
  userRegister,
  verifyOtp,
  userLogin,
  resendOtp,
  loadOtp,
  logout,
  loadForgotPassword,
  forgotPassword,
  loadResetForgotPassword,
  resetForgotPassword,
};
