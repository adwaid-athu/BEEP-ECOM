const User = require("../../Models/userSchema");
const Cart = require("../../Models/cartSchema");
const Address = require("../../Models/addressSchema");
const Product = require("../../Models/productSchema");
const Order = require("../../Models/orderSchema")
const Coupon = require("../../Models/couponSchema")
const Offer =  require("../../Models/offerSchema")
const { message } = require("statuses");

const loadCheckout = async (req, res) => {
  try {
    const userid = req.session.user;
    const cart = await Cart.findOne({ userId: userid })
    const items = cart ? cart.items : [];
    const address = await Address.findOne({userId:userid})
    const  addresses = address ? address.address : [];

   
    return res.status(200).render("checkout", {cart,items,addresses});
  } catch (error) {
    console.error("Checkout error:", error); 
    return res.status(500).render("error", { message: "Something went wrong" });
  }
  
};

const placeOrder = async (req, res) => {
  try { 
    const userId = req.session.user;
    const {address,paymentMethod,paymentStatus} = req.body;

    const fullAddress = await Address.findOne(
      { userId: userId },
      { address: { $elemMatch: { addressNo: address } } }
    );

    const cart = await Cart.findOne({ userId });

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

      const totalPrice = orderedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      let finalAmount = totalPrice
      let discount=null
      if(cart.appliedCoupon){
        discount = cart.appliedCoupon.offerPrice
        finalAmount = totalPrice - discount
      }

      if (isNaN(totalPrice)) {
        throw new Error("Total price calculation resulted in NaN");
      }

      const order = new Order({
        userId,
        orderedItems,
        paymentMethod,
        discount:discount,
        finalAmount: finalAmount,
        address: fullAddress.address[0], 
        status: "Processing",
      });

      await order.save();
      console.log("Order saved successfully:", order);

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
    }
  } catch (error) {
    console.error("Order placement error:", error);
    res.status(500).json({ success: false, message: "Something went wrong while placing the order", error: error.message });
  }
};

const loadOrderSuccess = async(req,res)=>{
res.render("orderSuccess" )
}





module.exports = {
  loadCheckout,
  placeOrder,
  loadOrderSuccess,
};


