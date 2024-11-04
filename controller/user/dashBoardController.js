const { redirect, message } = require("statuses");
const User = require("../../Models/userSchema");
const Address = require("../../Models/addressSchema");
const Order = require("../../Models/orderSchema")
const bcrypt = require("bcrypt");
const { session } = require("passport");

const loadDashBoard = async (req, res) => {
  try {
    const id = req.session.user;
    const user = await User.findById(id);
    const addressData = await Address.findOne({ userId: id });

    // Pagination variables
    const page = parseInt(req.query.page) || 1; // Default to page 1 if no query
    const limit = 5; // Orders per page
    const skip = (page - 1) * limit;

    const orderData = await Order.find({ userId: id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ userId: id });
    const totalPages = Math.ceil(totalOrders / limit);

    res.render("dashboard", {
      user,
      addressData,
      orderData,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error("Error loading Dashboard", error);
    return res.status(500).json({ message: "Server Error" });
  }
};


////////////////////////////////////////////// User Details Managment /////////////////////////////////////////////

const loadEditUser = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById({ _id: userId });
    res.render("userEdit", {
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.session.user;
    const { name, phone } = req.body;
    await User.updateOne({ _id: userId }, { name: name, phone: phone });
    res.redirect("/dashboard");
  } catch (error) {
    console.error(error, "error in updating user datails");
    res.status(500);
  }
};

const loadPasswordReset = async (req, res) => {
  try {
    res.render("passwordReset");
  } catch (error) {
    console.error(error, "error loading reset password");
    res.status(500);
  }
};

const saveNewPassword = async (req, res) => {
  try {
    const userid = req.session.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const matchPassword = await bcrypt.compare(currentPassword, user.password);
    if (!matchPassword) {
      return res.status(400).json({ message: "Check Your Password" });
    }
    if (newPassword === confirmPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.updateOne({ _id: userid }, { password: hashedPassword });
      req.session.destroy();
      res
        .status(200)
        .json({ success: true, message: "Password reset successfully." });
    } else {
      res
        .status(400)
        .json({ message: "New password and confirm password do not match." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error in resetting password" });
  }
};

////////////////////////////////////////////// Address Managment/////////////////////////////////////////////

const loadAddAddressPage = async (req, res) => {
  try {
    res.render("addAddress");
  } catch (error) {}
};
const saveNewAddress = async (req, res) => {
  const { addressType, name, city, landMark, state, pincode, phone, altPhone } = req.body;
  let addressNo = 1
  try {
    const userId = req.session.user;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not Found." });
  }
  const newAddress = {
    addressNo:addressNo,
    addressType:addressType,
    name:name,
    city:city,
    landMark:landMark,
    state:state,
    pincode:pincode,
    phone:phone,
    altPhone:altPhone,
  }
  const user = await Address.findOne({userId:userId})
if(!user){
  const addUserAddress = new Address({
    userId:userId,
    address:[newAddress]
  }) 
    addUserAddress.save()
}else{
  addressNo = user.address.length+1
  newAddress.addressNo=addressNo
  await Address.updateOne({userId:userId},{$push:{address:newAddress}})
}

   res.status(200).json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error saving address, please try again.",
      });
      console.error(error)
  }
};

const loadEditAddress = async(req,res)=>{
  try {
    const userId = req.session.user
    const {addressNo} = req.params
    const user = await Address.findOne({userId:userId})
    const address = user.address[addressNo-1]
    if(!address){
      res.status(500).json({success:false,message:"Not Address Data Found"})
    }
     res.render("editAddress",{address})
  } catch (error) {
    res.status(500)
    console.log(error,"Error loading Edit Address")
}
}

const editAddress = async (req, res) => {
  const { addressNo, addressType, name, city, landMark, state, pincode, phone, altPhone } = req.body;

  try {
    const userId = req.session.user;
    const addressDoc = await Address.findOne({ userId: userId });

    if (!addressDoc) {
      return res.status(500).json({ success: false, message: "User Address Not Found" });
    }

    // Ensure addressNo is within the valid range
    if (addressNo < 1 || addressNo > addressDoc.address.length) {
      return res.status(400).json({ success: false, message: "Invalid Address Number" });
    }

    // Update the specific address (using addressNo - 1 because arrays are zero-indexed)
    addressDoc.address[addressNo - 1] = {
      addressNo,
      addressType,
      name,
      city,
      landMark,
      state,
      pincode,
      phone,
      altPhone
    };

    // Save the updated document
    await addressDoc.save();

    res.status(200).json({ success: true, message: "Address updated successfully" });

  } catch (error) {1
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


const deleteAddress = async (req, res) => {
  try {
    const { addressNo } = req.params;
    const userId = req.session.user; 
    
    const userAddress = await Address.findOneAndUpdate(
      { userId:userId }, 
      { $pull: { address: { addressNo: addressNo } } }, 
      { new: true } 
    );
    
    if (!userAddress) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

   
    const updatedAddresses = userAddress.address.map((address, index) => {
      address.addressNo = index + 1; 
      return address;
    });

   
    userAddress.address = updatedAddresses;
    await userAddress.save();

    res.status(200).json({ success: true, message: "Address deleted and numbers updated successfully" });

  } catch (error) {
    console.error('Error during deletion or updating:', error);
    res.status(500).json({ success: false, message: "Execution error" });
  }
};

const viewOrder = async(req,res)=>{
  try {
    const orderId = req.params.id; 
    const order = await Order.findById(orderId).populate('orderedItems.product'); 

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    
    res.render('orderView', { order }); 
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const cancelOrder = async (req, res) => {
  const orderId = req.params.id;
  console.log(orderId)
  try {
      const order = await Order.findOne({ orderId });
      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }
      if (order.status === 'Cancelled') {
          return res.status(400).json({ message: 'Order is already cancelled' });
      }

      order.status = 'Cancelled';
      await order.save();
      res.status(200).json({ message: 'Order cancelled successfully' });
  } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = {
  loadDashBoard,
  loadEditUser,
  updateUser,
  loadPasswordReset,
  saveNewPassword,
  loadAddAddressPage,
  saveNewAddress,
  loadEditAddress,
  editAddress,
  deleteAddress,
  viewOrder,
  cancelOrder,
};
