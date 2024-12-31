const Wishlist = require("../../Models/wishlistSchema");
const Product = require("../../Models/productSchema");
const { message } = require("statuses");

const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const wishlist = await Wishlist.findOne({ userId }).populate(
      "items.product"
    );

    const items = wishlist ? wishlist.items : [];

    res.render("wishlist", { items });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.params.id;
     if(!userId){
      res.status(400).json({success:false,message:"User have to log in "})
     }
     let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    const productExists = wishlist.items.some(
      (item) => item.product.toString() === productId
    );

    if (productExists) {
      return res.status(400).json({
          success: false, 
          message: "The Product Aldready Exist In The Wishlist",
        });
    }
    wishlist.items.push({ product: productId });
    await wishlist.save();

    res.status(200).json({success:true})
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.body.productId;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    wishlist.items = wishlist.items.filter(
      (product) => product.product.toString() !== productId 
    );

    await wishlist.save();

    res.status(200).json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



module.exports = { loadWishlist, addToWishlist, removeFromWishlist };
