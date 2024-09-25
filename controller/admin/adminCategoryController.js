const Category = require("../../Models/categorySchema");

const loadAdminCategory = async (req, res) => {
    try {
        let search = req.query.search || '';
        let page = parseInt(req.query.page) || 1;
        let limit = 5;

        let filter = {};
        if (search) {
            filter = { name: { $regex: search, $options: 'i' } };
        }

        const categories = await Category.find(filter)
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
        if(category){
        res.render("editCategory",{category})
        }
    } catch (error) {
        console.log(error);
        res.status(404).json({ error: "page not found" });
    }
}
const editCategory = async(req,res)=>{
    try {
        console.log(' iam in')
        const {name,description} = req.body
        const id = req.params.id 
        console.log(id,name,description)
        const category = await Category.updateOne({_id:id},{$set:{name:name,description:description}})
        if(category){
            return res.status(200).json({success:true})
        }else{
            return res.status(500).json({ error: "server error" });

        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "server error" });
    }
}

module.exports = {
    loadAdminCategory,
    addCategory,
    unlistCategory,
    listCategory,
    deleteCategory,
    loadEditCategory,
    editCategory,

};
