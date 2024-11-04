const Product = require("../../Models/productSchema");
const Brand = require("../../Models/brandSchema");
const Category = require("../../Models/categorySchema");
const User = require("../../Models/userSchema");
const { load } = require("mime");
const { render } = require("ejs");
const { message } = require("statuses");
const Cart = require("../../Models/cartSchema");

const loadCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const cart = await Cart.findOne({ userId: userId }).populate(
      "items.product"
    );
    const items = cart ? cart.items : [];
    res.render("cart", { items });
  } catch (error) {
    console.error(error);
  }
};
const addToCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.session.user;
    if (!userId) {
      return res
        .status(400)
        .json({ message: "User have login to add product to cart" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const productQuantity = product.quantity 
    console.log(productQuantity)

    let cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      cart = new Cart({ userId, items: [{ product, quantity: 1 }] });
    } else {
      const productIndex = cart.items.findIndex((p) =>
        p.product.equals(productId)
      );  

      if (productIndex > -1) {
        const currentQuantity = cart.items[productIndex].quantity;
         if(currentQuantity>=productQuantity){
        if (currentQuantity >= 5) {
          return res.status(400).json({
            message: "Cannot add more than this of the same product",
          });
        }
        return res.status(400).json({
          message: "Cannot add more product the product stock is limited ",
        });

      }

        cart.items[productIndex].quantity += 1;
      } else {
        cart.items.push({ product, quantity: 1 });
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



module.exports = {
  loadCart,
  addToCart,
  updateQuantity,
  removeItem,
};
