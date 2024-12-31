const { redirect, message } = require("statuses");
const User = require("../../Models/userSchema");
const Address = require("../../Models/addressSchema");
const Order = require("../../Models/orderSchema")
const Product = require("../../Models/productSchema") 
const Wallet = require("../../Models/walletSchema")
const PDFDocument=require("pdfkit")
const fs = require('fs')
const bcrypt = require("bcrypt");
const { session } = require("passport");
const mongoose = require("mongoose")

const loadDashBoard = async (req, res) => {
  try {
    const id = req.session.user;

    const user = await User.findById(id);
    const addressData = await Address.findOne({ userId: id });

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const orderData = await Order.find({ userId: id })
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ userId: id });
    const totalPages = Math.ceil(totalOrders / limit);

    const walletPage = parseInt(req.query.walletPage) || 1;
    const walletLimit = 5;
    const walletSkip = (walletPage - 1) * walletLimit;

    let wallet = await Wallet.findOne({ userId: id });

    if (!wallet) {
      wallet = new Wallet({
        userId: id,
        balance: 0,
        transactions: [],
      });
      await wallet.save();
    }

    const totalWalletTransactions = wallet.transactions.length;
    const totalWalletPages = Math.ceil(totalWalletTransactions / walletLimit);
    const paginatedTransactions = wallet.transactions.slice(walletSkip, walletSkip + walletLimit);

    res.render("dashboard", {
      user,
      addressData,
      orderData,
      currentPage: page,
      totalPages,
      walletBalance: wallet.balance,
      walletTransactions: paginatedTransactions,
      walletPage,
      totalWalletPages,
    });
  } catch (error) {
    console.error("Error loading Dashboard", error);
    return res.status(500).render("error", { message: "Failed to load the dashboard. Please try again later." });
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

    if (addressNo < 1 || addressNo > addressDoc.address.length) {
      return res.status(400).json({ success: false, message: "Invalid Address Number" });
    }

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

  try {
    const order = await Order.findOne({ orderId }).populate('userId');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    order.status = 'Cancelled';
    await order.save();

    if (order.paymentMethod == 'razorPay') {
      const user = order.userId;  
      const refundAmount = order.finalAmount;
      console.log(refundAmount)
      let wallet = await Wallet.findOne({ userId: user._id });

      if (!wallet) {
        wallet = new Wallet({
          userId: user._id,
          balance: 0,
          transactions: [],
        });
      }
      console.log("iu")

      wallet.balance += refundAmount;

      wallet.transactions.push({
        transactionId: new mongoose.Types.ObjectId(),
        type: 'credit',
        amount: refundAmount,
        date: new Date(),
        description: `Refund for cancelled order ${orderId}`,
        orderId: order._id,
        status: 'completed',
      });

      await wallet.save();
    }

    res.status(200).json({ message: 'Order cancelled and refund processed' });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const returnOrder = async (req, res) => {
  const orderId = req.params.id;
  console.log(orderId)
  try {
      const order = await Order.findOne({ orderId });
      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }
      if (order.status === 'Cancelled') {
          return res.status(400).json({ message: 'Order is already returned' });
      }
      order.status = 'Return';
      await order.save();
      res.status(200).json({ message: 'Order return successfully' });
  } catch (error) {
      console.error("Error return order:", error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

const downloadInvoice = async (req, res) => {
  try {
      const orderId = req.params.id;

      // Fetch the order details, populating the `orderedItems.product` reference with product details (including name)
      const order = await Order.findOne({ orderId })
                                .populate('orderedItems.product', 'productName');  // Populate only the `productName` field

      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }

      const doc = new PDFDocument();

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);

      // Pipe the PDF document to the response
      doc.pipe(res);

      // Add the Title
      doc.fontSize(16).text('Invoice', { align: 'center' });
      doc.moveDown();

      // Add Order ID and Invoice Date
      doc.fontSize(12).text(`Order ID: ${orderId}`, { align: 'left' });
      doc.text(`Invoice Date: ${new Date(order.invoiceDate).toLocaleDateString()}`, { align: 'left' });
      doc.moveDown();

      // Add Customer Details
      doc.text(`Customer ID: ${order.userId}`, { align: 'left' });
      doc.moveDown();

      // Table headers and dimensions
      const tableTop = 180;
      const columnWidth = [200, 100, 100, 100];
      const rowHeight = 20;
      const margins = { left: 50, top: tableTop };

      // Header row
      doc.fontSize(12).text('Item', margins.left, margins.top);
      doc.text('Quantity', margins.left + columnWidth[0], margins.top);
      doc.text('Price', margins.left + columnWidth[0] + columnWidth[1], margins.top);
      doc.text('Total', margins.left + columnWidth[0] + columnWidth[1] + columnWidth[2], margins.top);

      // Draw the header borders
      columnWidth.forEach((width, index) => {
          const xPos = margins.left + columnWidth.slice(0, index).reduce((sum, w) => sum + w, 0);
          doc.rect(xPos, margins.top - 5, width, rowHeight).stroke();
      });

      // Add data rows
      if (order.orderedItems && Array.isArray(order.orderedItems)) {
          order.orderedItems.forEach((item, index) => {
              const rowY = margins.top + rowHeight + (index * rowHeight);

              // Check if item.product.name exists
              const productName = item.product?.productName || 'Unknown Product';  // Access productName after population

              doc.text(productName, margins.left, rowY);
              doc.text(item.quantity || 0, margins.left + columnWidth[0], rowY);
              doc.text(
                  (item.price && !isNaN(item.price) ? item.price.toFixed(2) : '0.00'), 
                  margins.left + columnWidth[0] + columnWidth[1], 
                  rowY
              );
              doc.text(
                  (item.quantity && !isNaN(item.quantity) ? (item.quantity * item.price).toFixed(2) : '0.00'), 
                  margins.left + columnWidth[0] + columnWidth[1] + columnWidth[2], 
                  rowY
              );

              // Draw borders for the data rows
              columnWidth.forEach((width, colIndex) => {
                  const xPos = margins.left + columnWidth.slice(0, colIndex).reduce((sum, w) => sum + w, 0);
                  doc.rect(xPos, rowY - 5, width, rowHeight).stroke();
              });
          });
      }

      // Add Total Amount
      const discount = (order.discount && !isNaN(order.discount)) ? order.discount : 0;
      const finalAmount = (order.finalAmount && !isNaN(order.finalAmount)) ? order.finalAmount : 0;

      const totalY = margins.top + rowHeight + (order.orderedItems.length * rowHeight) + 10;
      doc.text(`Discount: ${discount.toFixed(2)}`, margins.left, totalY + 20);
      doc.text(`Final Amount: ${finalAmount.toFixed(2)}`, margins.left, totalY + 40);

      // Add Footer
      doc.fontSize(10).text('Thank you for your purchase!', { align: 'center', baseline: 'bottom' });

      // End the PDF document stream
      doc.end();
  } catch (error) {
      console.error('Error generating invoice:', error);
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
  returnOrder,
  downloadInvoice,
};
