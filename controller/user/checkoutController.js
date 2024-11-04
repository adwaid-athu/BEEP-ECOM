const User = require("../../Models/userSchema");
const Cart = require("../../Models/cartSchema");
const Address = require("../../Models/addressSchema");
const Product = require("../../Models/productSchema");
const Order = require("../../Models/orderSchema")
const { message } = require("statuses");

const loadCheckout = async (req, res) => {
  try {
    const userid = req.session.user;
    const cart = await Cart.findOne({ userId: userid }).populate({
      path: "items.product",
      populate: {
        path: "brand",
      },
    });
    const items = cart ? cart.items : [];
    const address = await Address.findOne({userId:userid})
    const  addresses = address ? address.address : [];

   
    return res.status(200).render("checkout", { items,addresses});
  } catch (error) {
    console.error("Checkout error:", error); 
    return res.status(500).render("err or", { message: "Something went wrong" });
  }
  
};

const placeOrder = async (req, res) => {
  try { 
    const userId = req.session.user;
    const { address, paymentMethod, grandTotal } = req.body;

    const fullAddress = await Address.findOne(
      { userId: userId },
      { address: { $elemMatch: { addressNo: address } } }
    );
    const itemsInCart = await Cart.findOne({ userId: userId });

    if (itemsInCart && fullAddress) {
      const order = new Order({
        userId: userId,
        orderedItems: itemsInCart.items,
        paymentMethod: paymentMethod,
        finalAmount: grandTotal,
        address: fullAddress.address,
        status: "Pending"
      });

      await order.save();
      console.log("Order saved successfully:", order);

      for (let i = 0; i < itemsInCart.items.length; i++) {
        const productId = itemsInCart.items[i].product;
        const quantity = itemsInCart.items[i].quantity;

        
        console.log(`Updating product ${productId} with quantity ${quantity}`);
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: productId, quantity: { $gte: quantity } },
          { $inc: { quantity: -quantity } },
          { new: true }
        );

        console.log("Product after quantity update:", updatedProduct);

       
        if (updatedProduct.quantity <= 0) {
          updatedProduct.status = "out of stock";
          await updatedProduct.save(); 
          console.log(`Product ${productId} marked as out of stock.`);
        }
      }

      await Cart.deleteOne({ userId: userId });
      console.log("Cart cleared for user:", userId);

      res.status(200).json({ success: true });
    } else {
      console.log("Cart or address not found for user:", userId);
      res.status(404).json({ success: false, message: "Cart items or address not found" });
    }
  } catch (error) {
    console.error("Order placement error:", error);
    res.status(500).json({ success: false, message: "Something went wrong while placing the order" });
  }
};


const loadOrderSuccess = async(req,res)=>{
  res.render("orderSuccess" )
}

module.exports = {
  loadCheckout,
  placeOrder,
  loadOrderSuccess
};


