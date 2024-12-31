const User = require("../../Models/userSchema");
const Cart = require("../../Models/cartSchema");
const Address = require("../../Models/addressSchema");
const Product = require("../../Models/productSchema");
const Order = require("../../Models/orderSchema")
const Razorpay = require("razorpay");
const { name } = require("ejs");
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});


const createOrder = async (req, res) => {
    try {
      const userId = req.session.user;
      let {address,paymentMethod,grandTotal} = req.body;
  
      const fullAddress = await Address.findOne(
        { userId: userId },
        { address: { $elemMatch: { addressNo: address } } }
      );
      const user = await User.findById(userId)
      const cart = await Cart.findOne({ userId }).populate('items.product');
  
      if (cart && fullAddress && fullAddress.address.length > 0) {
        const orderedItems = cart.items.map(item => {
            if (!item || !item.product) {
                throw new Error(`Invalid item structure: ${JSON.stringify(item)}`);
            }
  
          let price = item.product.salePrice;
          if (typeof price !== 'number' || price <= 0) {
            throw new Error(`Invalid price for item: ${item.product.productName || 'Unnamed product'}`);
          }

      let offer = 0

          if (item.product.offer && item.product.offer.discount) {
            offer = item.product.offer.discount;
          } else if (item.product.category && item.product.category.offer && item.product.category.offer.discount) {
            offer = item.product.category.offer.discount;
          } else if (item.product.brand && item.product.brand.offer && item.product.brand.offer.discount) {
            offer  = item.product.brand.offer.discount;
          }

          if(offer&&offer>0){
            price = item.product.salePrice - (item.product.salePrice * (offer / 100));
          }

          return {
            product: item.product._id,
            quantity: item.quantity,
            price: price
          };
        });
        let discount=null
        if(cart.appliedCoupon){
          discount = cart.appliedCoupon.offerPrice||0
        }

        const order = new Order({
          userId,
          orderedItems,
          paymentMethod,
          discount:discount,
          finalAmount: grandTotal,
          address: fullAddress.address[0],  
          status: "Pending"
        });
  
       const newOrder = await order.save();
        console.log("Order saved successfully:", newOrder);
        const amount = grandTotal*100
        const option = {
            amount:amount,
            currency:'INR',
            receipt:'razorUser@gmail.com'
        }

        razorpayInstance.orders.create(option,(err,order)=>{
            if(!err){
                res.status(200).send({
                    success:true,
                    msg:"Order Created",
                    order_id:order._id,
                    amount:amount,
                    key_id:RAZORPAY_KEY_ID,
                    contact:user.phone,
                    name:user.name,
                    email:user.email,
                    orderId:newOrder.orderId
                })
            }else{
                res.status(400).send({success: false, msg: 'Something went wrong!'});
            }
        })

      } else {
        res.status(400).json({ success: false, message: "Cart or address not found" });
      }
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

const updateStockAndClearCart = async (req, res) => {
  const userId = req.session.user; 
  const orderId = req.body.orderId||null
  console.log(orderId)

  try {

    const cart = await Cart.findOne({ userId }).populate('items.product');
    const order = await Order.findOne({ orderId });

    if (order) {
      order.status = "Processing";
      await order.save();
      console.log(`Order ${orderId} status updated to 'Processing'.`);
      res.status(200).json({success:true})
    }

    if (cart) {
     
      for (const item of cart.items) {
        const productId = item.product._id;
        const quantity = item.quantity;

        console.log(`Updating product ${productId} with quantity ${quantity}`);
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: productId, quantity: { $gte: quantity } },
          { $inc: { quantity: -quantity } },
          { new: true }
        );

        if (!updatedProduct) {
          console.error(`Product ${productId} could not be updated - insufficient stock or product not found.`);
          continue;
        }

        console.log("Product after quantity update:", updatedProduct);

        if (updatedProduct.quantity <= 0) {
          updatedProduct.status = "out of stock";
          await updatedProduct.save();
          console.log(`Product ${productId} marked as out of stock.`);
        }
      }

    await Cart.deleteOne({ userId });
    console.log("Cart cleared for user:", userId);

      res.status(200).json({ success: true });
    } else {
      console.log("Cart or address not found for user:", userId);
      res.status(404).json({ success: false, message: "Cart items or address not found" });
    } } catch (error) {
      console.error("Order placement error:", error);
      res.status(500).json({ success: false, message: "Something went wrong ", error: error.message });
    }
  };

  const continuePayment = async (req,res)=>{
    const { orderId } = req.body;  
    console.log(orderId)

    try {
        const order = await Order.findOne({ orderId: orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const user = req.session.user;  

        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const userDetails = await User.findById(user);  

        if (!userDetails) {
            return res.status(404).json({ success: false, message: "User details not found" });
        }

        const amount = order.finalAmount * 100;  

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: amount,
            currency: "INR",
            receipt: orderId, 
        });

        return res.json({
            success: true,
            msg: "Order Created",
            order_id: razorpayOrder.id,
            amount: amount,
            key_id: razorpayInstance.key_id,  
            contact: userDetails.phone,  
            name: userDetails.name,  
            email: userDetails.email,
            orderId:orderId  
        });

    } catch (error) {
        console.error("Error processing continue payment:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while processing the payment.",
        });
    }
};
const updateOrderStatus = async(req,res)=>{
  try {
    const {orderId} = req.body

    const order = await Order.findOne({ orderId });

    if (order) {
      order.status = "Processing";
      await order.save();
      console.log(`Order ${orderId} status updated to 'Processing'.`);
      res.status(200).json({success:true})
    }
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred updating order status",
  });
  }
}

module.exports = {
  createOrder,
  updateStockAndClearCart,
  continuePayment,
  updateOrderStatus,
};
