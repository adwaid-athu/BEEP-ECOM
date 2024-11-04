const status = require("statuses");
const Brand = require("../../Models/brandSchema");
const Product = require("../../Models/productSchema");

const loadBrand = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    let query = {};

    if (search) {
      query.brandName = { $regex: search, $options: 'i' };  
    }

    const brandData = await Brand.find(query)
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

const addBrand = async (req,res)=>{
  const {brandName} = req.body
  if(brandName){
    const newBrand = new Brand({brandName:brandName})
    await newBrand.save()

    res.status(200).json({success:true})
  }
 
}

const unblockBrand = async(req,res)=>{
  try {
    const {brandId} = req.body
    if(brandId){
      await Brand.updateOne({_id:brandId},{$set:{isBlocked:false}})
      await Product.updateMany({brand:brandId},{$set:{isBlocked:false}})
      res.status(200).json({success:true})
    }
  } catch (error) {
    res.status(500).json({success:false})
  }
}

const blockBrand = async(req,res)=>{
  try {
    const {brandId} = req.body
    if(brandId){
      await Brand.updateOne({_id:brandId},{$set:{isBlocked:true}})
      await Product.updateMany({brand:brandId},{$set:{isBlocked:true}})

      res.status(200).json({success:true})
    }
  } catch (error) {
    res.status(500).json({success:false})
  }
}

const deleteBrand = async(req,res)=>{
  try {
    const {brandId} = req.body
    if(brandId){
      await Brand.deleteOne({_id:brandId})
      await Product.deleteMany({brand:brandId})
      res.status(200).json({success:true})
    }
  } catch (error) {
    res.status(500).json({success:false})
  }
}

module.exports = {
  loadBrand,
  addBrand,
  unblockBrand,
  blockBrand,
  deleteBrand
};
