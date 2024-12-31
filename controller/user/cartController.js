const Product = require("../../Models/productSchema");
const Brand = require("../../Models/brandSchema");
const Category = require("../../Models/categorySchema");
const User = require("../../Models/userSchema");
const Offer = require("../../Models/offerSchema")
const { load } = require("mime");
const { render } = require("ejs");
const { message } = require("statuses");
const Cart = require("../../Models/cartSchema");
const Coupon = require("../../Models/couponSchema")


const loadCart = async (req, res) => {
  try {
    const userId = req.session.user;

    let cart = await Cart.findOne({ userId: userId })

    if (!cart) {
      cart = { items: [], appliedCoupon: null }; // Dummy cart structure
    }
    
    const items = cart.items;
    const subtotal = items.length > 0 ? await subTotal(userId) : 0;

    const coupons = await Coupon.find({
      isActive: true,
      expireOn: { $gt: Date.now() },
      minimumPrice: { $lte: subtotal },
    });


    res.render("cart", { items, coupons, cart });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


const addToCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.session.user;

    if (!userId) {
      return res.status(400).json({
        message: "User must log in to add products to the cart",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const maxCartQuantity = Math.min(5, product.quantity); 

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ 
        userId, 
        items: [{ product: productId, quantity: 1 }] 
      });
    } else {
      const productIndex = cart.items.findIndex((p) => 
        p.product.equals(productId)
      );

      if (productIndex > -1) {
        const currentQuantity = cart.items[productIndex].quantity;

        if (currentQuantity >= maxCartQuantity) {
          return res.status(400).json({
            message: `Cannot add more. Maximum allowed is ${maxCartQuantity} for this product.`,
          });
        }

        cart.items[productIndex].quantity += 1; 
      } else {
        cart.items.push({ product: productId, quantity: 1 });
      }
    }

    await cart.save();

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
};



const updateQuantity = async (req, res) => {
  try {

    const userId = req.session.user;
    const { product, quantity } = req.body;

    console.log('Update Request:', {
      userId: userId,
      productId: product,
      quantity: quantity
    });

    if (!quantity || quantity < 1) {
      return res.json({ success: false, message: 'Invalid quantity' });
    }

   
    const result = await Cart.findOneAndUpdate(
      { 
        userId: userId, 
        'items.product': product 
      },
      { 
        $set: { 'items.$.quantity': parseInt(quantity) }
      },
      { new: true } 
    );


    if (!result) {
      return res.json({ success: false, message: 'Cart or product not found' });
    }

    res.json({ 
      success: true, 
      message: 'Quantity updated successfully',
      cart: result 
    });

  } catch (error) {
    console.error('Error updating quantity:', error);
    res.json({ 
      success: false, 
      message: 'Error updating quantity', 
      error: error.message 
    });
  }
};

const removeItem = async (req, res) => {
  try {
    const userId = req.session.user;
    const { product } = req.body;

    console.log('Remove Request:', {
      userId: userId,
      productId: product
    });


    const result = await Cart.findOneAndUpdate(
      { userId: userId },
      { 
        $pull: { 
          items: { 
            product: product 
          } 
        } 
      },
      { new: true } 
    );

   

    if (!result) {
      return res.json({ success: false, message: 'Cart not found' });
    }

    res.status(200).json({ 
      success:true, 
      message: 'Item removed successfully',
    });

  } catch (error) {
    console.error('Error removing item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error removing item', 
      error: error.message 
    });
  }
};

const applyCoupon = async(req,res)=>{
  const user = req.session.user
  const couponCode = req.body.couponCode
  if(!couponCode){
    res.status(404).json({success:false,message:"Coupon Code Missing"})
  }
  const coupon = await Coupon.findOne({couponCode:couponCode})
  if(!coupon){
    res.status(404).json({succes:false,message:"Coupon Not Found"})
  }
  const result = await couponCheck(user,couponCode)
  if(result.success){
  await Cart.findOneAndUpdate({userId:user},{appliedCoupon:coupon._id})
  res.status(200).json({success:true,message:"Coupon Applied"})
  }
  else{
    res.status(400).json({success:false,message:"Coupon Requirement not satisfied"})
  }
}

const removeCoupon = async (req, res) => {
  try {
    const userId = req.session.user; 
    const cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      return res.status(404).send({ message: 'Cart not found.' });
    }

    cart.appliedCoupon = null; 
    await cart.save();

    res.status(200).send({ success: true, message: 'Coupon removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'An error occurred.' });
  }
};
async function subTotal(userId) {
  const cart = await Cart.findOne({ userId: userId })
      .populate({
        path: "items.product",
        select: "salePrice",   
      })
      .exec();

    if (!cart) {
      throw new Error("Cart not found");
    }

    
    const subtotal = cart.items.reduce((total, item) => {
      const salePrice = item.product.salePrice || 0;
      return total + salePrice * item.quantity;
    }, 0);

    return subtotal
}

async function couponCheck(userId,couponCode) {
  try {
    const subtotal = await subTotal(userId)
    const coupon = await Coupon.findOne({couponCode:couponCode})
  if(subtotal>=coupon.minimumPrice){
    return {success:true}
  }else{
    return {success:false}
  }
  } catch (error) {
    console.error("Error in couponCheck:", error);
    throw error; 
  }
}




module.exports = {
  loadCart,
  addToCart,
  updateQuantity,
  removeItem,
  applyCoupon,
  removeCoupon,
};
