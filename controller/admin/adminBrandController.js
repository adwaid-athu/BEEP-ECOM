const status = require("statuses");
const Brand = require("../../Models/brandSchema");
const Product = require("../../Models/productSchema");
const Offer = require("../../Models/offerSchema");

const loadBrand = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    let query = {};

    if (search) {
      query.brandName = { $regex: search, $options: "i" };
    }

    const brandData = await Brand.find(query)
      .populate("offer")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBrands = await Brand.countDocuments(query);
    const totalPages = Math.ceil(totalBrands / limit);

    res.render("adminBrand", {
      data: brandData,
      currentPage: page,
      totalPages: totalPages,
      search: search,
    });
  } catch (error) {
    console.error("Error fetching brand data:", error);
    res.status(500).send("Internal Server Error");
  }
};

const addBrand = async (req, res) => {
  const { brandName } = req.body;
  if (brandName) {
    const newBrand = new Brand({ brandName: brandName });
    await newBrand.save();

    res.status(200).json({ success: true });
  }
};

const unblockBrand = async (req, res) => {
  try {
    const { brandId } = req.body;
    if (brandId) {
      await Brand.updateOne({ _id: brandId }, { $set: { isBlocked: false } });
      await Product.updateMany(
        { brand: brandId },
        { $set: { isBlocked: false } }
      );
      res.status(200).json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const blockBrand = async (req, res) => {
  try {
    const { brandId } = req.body;
    if (brandId) {
      await Brand.updateOne({ _id: brandId }, { $set: { isBlocked: true } });
      await Product.updateMany(
        { brand: brandId },
        { $set: { isBlocked: true } }
      );

      res.status(200).json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { brandId } = req.body;
    if (brandId) {
      await Brand.deleteOne({ _id: brandId });
      await Product.deleteMany({ brand: brandId });
      res.status(200).json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const loadEditBrand = async (req, res) => {
  try {
    const id = req.params.id;
    const brand = await Brand.findOne({ _id: id });
    const offer = await Offer.find({ isActive: true });
    if (brand) {
      res.render("editBrand", { brand, offers: offer });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "page not found" });
  }
};
const EditBrand = async (req, res) => {
  try {
    const { name, offer } = req.body;
    const id = req.params.id;

    if (!name || !id) {
      return res.status(400).json({ error: "Name and ID are required" });
    }

    console.log("Updating brand:", { id, name, offer });

    const updateData = { name };
    if (offer) {
      updateData.offer = offer;
    }

    const updateOperation = offer ? { $set: updateData } : { $set: { name }, $unset: { offer: "" } };

    const result = await Brand.updateOne({ _id: id }, updateOperation);

    if (result.modifiedCount > 0) {
      return res.status(200).json({ success: true });
    } else {
      return res
        .status(404)
        .json({ error: "Brand not found or no changes made" });
    }
  } catch (error) {
    console.error("Error updating brand:", error.message);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};

module.exports = {
  loadBrand,
  addBrand,
  unblockBrand,
  blockBrand,
  deleteBrand,
  EditBrand,
  loadEditBrand,
};
