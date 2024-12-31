const Category = require("../../Models/categorySchema");
const Product = require("../../Models/productSchema")
const Offer = require("../../Models/offerSchema")

const loadAdminCategory = async (req, res) => {
    try {
        let search = req.query.search || '';
        let page = parseInt(req.query.page) || 1;
        let limit = 5;

        let filter = {};
        if (search) {
            filter = { name: { $regex: search, $options: 'i' } };
        }

        const categories = await Category.find(filter).populate("offer")
            .skip((page - 1) * limit)
            .limit(limit);

        const count = await Category.countDocuments(filter);

        res.render('adminCategory', {
            categories,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            search
        });
    } catch (err) {
        console.log(err);
        res.redirect('/admin/dashboard');
    }
};

const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }

        const newCategory = new Category({ name, description });
        await newCategory.save();

        res.status(200).json({ message: "Category added successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "An error occurred while adding the category" });
    }
};

const unlistCategory = async(req,res) => {
    try{
        const {id} = req.body;
        const categoryData = await Category.findOne({_id:id})
       
        if(categoryData){
            await Category.updateOne({_id:id},{$set:{isListed:false}})
            await Product.updateMany({category:id},{$set:{isBlocked:true}})
            res.status(200).json({success:true});
        }
        
    }catch(error){ 
        console.log(error);
        res.status(500).json({ error: "server Error" });
    }
}
const listCategory = async(req,res) =>{
    try {
        const {id} =req.body
        const categoryData = await Category.findOne({_id:id})
        
        if(categoryData){
            await Category.updateOne({_id:id},{$set:{isListed:true}})
            await Product.updateMany({category:id},{$set:{isBlocked:false}})
           res.status(200).json({success:true});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "server Error" });
    }
}
const deleteCategory = async(req,res)=>{
try {
        const {id} =req.body
        const categoryData = await Category.deleteOne({_id:id})
        const deleteProduct =  await Product.deleteMany({category:id})
        if(categoryData){
           res.status(200).json({success:true});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "server Error" });
    }

}
const loadEditCategory = async(req,res)=>{
    try {
        const id = req.params.id
        const category = await Category.findOne({_id:id})
        const offer = await Offer.find({isActive:true})
        if(category){
        res.render("editCategory",{category,
            offers:offer
        })
        }
    } catch (error) {
        console.log(error);
        res.status(404).json({ error: "page not found" });
    }
}
const editCategory = async (req, res) => {
    try {
        const { name, description, offer } = req.body;
        const id = req.params.id; 
        if (!name || !description || !id) {
            return res.status(400).json({ error: "Name, description, and ID are required" });
        }

        console.log("Updating category:", { id, name, description, offer });

       
        const updateData = { name, description };

        const updateOperation = offer ? { $set: { ...updateData, offer } } : { $set: updateData, $unset: { offer: "" } }; 

        const result = await Category.updateOne({ _id: id }, updateOperation);

        if (result.modifiedCount > 0) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(404).json({ error: "Category not found or no changes made" });
        }
    } catch (error) {
        console.error("Error updating category:", error.message);
        return res.status(500).json({ error: "An unexpected error occurred" });
    }
};

    

module.exports = {
    loadAdminCategory,
    addCategory,
    unlistCategory,
    listCategory,
    deleteCategory,
    loadEditCategory,
    editCategory,

};
