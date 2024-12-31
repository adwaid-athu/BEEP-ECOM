const { code } = require("statuses");
const Coupon = require("../../Models/couponSchema");

const loadCouponsPage = async (req, res) => {
  try {
    const perPage = 5;
    const page = parseInt(req.query.page) || 1; 

    const totalCoupons = await Coupon.countDocuments(); 
    const coupons = await Coupon.find()
    .sort({createdOn:-1})
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render("adminCouponManagment", {
      coupons,
      currentPage: page,
      totalPages: Math.ceil(totalCoupons / perPage),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const loadAddCouponPage = (req, res) => {
  try {
    res.render("addCouponPage");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const {couponCode,expireOn, offerPrice, minimumPrice } = req.body;
    if (!couponCode|| !expireOn || !offerPrice || !minimumPrice) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const coupon = new Coupon({
      couponCode,
      expireOn,
      offerPrice,
      minimumPrice,
    });

    await coupon.save();

    res.status(201).json({ message: 'Coupon added successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json(coupons); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    let { couponCode, expireOn, offerPrice, minimumPrice } = req.body;
    
    expireOn = new Date(expireOn);
    
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id, 
      { couponCode, expireOn, offerPrice, minimumPrice },
      { new: true } 
    );

    if (!updatedCoupon) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Coupon not found'
      });
    }

    res.status(200).json({ 
      status: 'success',
      message: 'Coupon updated successfully'
    });
  } catch (error) {
    
    res.status(400).json({ 
      status: 'error',
      message: error.message 
    });
  }
};


const deleteCoupon = async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!deletedCoupon)
      return res.status(404).json({ error: "Coupon not found" });
    res.redirect("/admin/coupon"); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const loadUpdateCouponPage = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    res.render('updateCoupon', { coupon }); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deactivateCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);

    const coupon = await Coupon.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);  
    res.status(500).json({ error: error.message });
  }
};

const activateCoupon = async(req,res)=>{
  try {
    const id = req.params.id
    const coupon = await Coupon.findByIdAndUpdate(id,{isActive:true},{ new: true });
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    res.status(200).json({success:true})
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}


module.exports = {
  loadCouponsPage,
  loadAddCouponPage,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  loadUpdateCouponPage,
  deactivateCoupon,
  activateCoupon,
};