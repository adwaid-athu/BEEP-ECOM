const Product = require("../../Models/productSchema")
const Brand = require("../../Models/brandSchema")
const Category = require("../../Models/categorySchema")
const User = require("../../Models/userSchema")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const { CANCELLED } = require("dns")
const { message } = require("statuses")
const { error } = require("console")
const { editCategory } = require("./adminCategoryController")

const loadProduct = async (req, res) => {
    try {
        const { search = '', page = 1 } = req.query; 
        const limit = 5; 
        const skip = (page - 1) * limit; 

        const totalProducts = await Product.countDocuments({
            productName: { $regex: search, $options: 'i' }
        });

        const products = await Product.find({
            productName: { $regex: search, $options: 'i' } 
        })
        .skip(skip)
        .limit(limit)
        .populate('category')
        .populate('brand')
        .exec();

        const totalPages = Math.ceil(totalProducts / limit); 

        res.render("adminProduct", {
            products,
            search,
            currentPage: parseInt(page),
            totalPages,
            totalProducts,
        });
    } catch (error) {
        console.error(error, "Server Error");
        res.status(500).send("Server Error"); 
    }
};

const loadAddProduct = async(req,res)=>{
    try { 
        const category = await Category.find({isListed:true})
        const brand = await Brand.find({isBlocked:false})

        res.render("adminAddProduct",{
            categories:category,
            brands:brand
        })    
    } catch (error) {
        console.error(error,"error rendering addProduct")
        res.status(500)
    }
}

const addProduct = async (req, res) => {
    try {
        const formData = req.body; 
        console.log(formData)

        const productExist = await Product.findOne({
            productName: formData.productName,
        });

        if (!productExist) {
            const images = [];

            console.log('images',req.files)
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;
                    const resizedImagePath = path.join("Public", "upload", "product-images",req.files[i].filename);
                   
                    await sharp(originalImagePath).resize({ width: 800, height: 800 }).toFile(resizedImagePath);
                    images.push(req.files[i].filename);
                }
            }

            const newFormData = new Product({
                productName: formData.productName, 
                description: formData.productDescription,
                brand: formData.productBrand,
                category: formData.productCategory,
                regularPrice: formData.regularPrice,
                salePrice: formData.salePrice,
                createdAt: new Date(),
                quantity: formData.quantity,
                productImage: images,
                status: "Available"
            });

            await newFormData.save();
            
            return res.redirect("/admin/products")
        } else {
            return res.status(400).json({ success: false, message: "Product already exists" });
        }
    } catch (error) {
        console.error("Error saving product", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteProduct = async(req,res)=>{
    try {
        const {id} =req.body
        if(id){
             await Product.deleteOne({_id:id})
            res.status(200).json({success:true})
        }
        else{
            res.status(500).json({success:false})
        }
    } catch (error) {
        res.status(500)
        console.error("something went wrong",error)
    }
}

const blockProduct = async(req,res)=>{
    try {
        const {id} = req.body
        await Product.updateOne({_id:id},{$set:{isBlocked:true}})
        res.status(200).json({success:true})
    } catch (error) {
        res.status(500)
        console.error("something went wrong",error)
    }
}

const unblockProduct = async(req,res)=>{
    try {
        const {id} = req.body
        await Product.updateOne({_id:id},{$set:{isBlocked:false}})
        res.status(200).json({success:true})
    } catch (error) {        
        res.status(500)
        console.error("something went wrong",error)
    }
}

const loadEditProduct = async(req,res)=>{
    try {
        const {id} = req.params
        const product = await Product.findOne({ _id:id }).populate('category') 
        .populate('brand') 
        const category = await Category.find({isListed:true})
        const brand = await Brand.find({isBlocked:false})

        if(product){
            res.render("editProduct",{
                productId:id,
                product:product,
                categories:category,
                brands:brand,
                productImages:product.productImage
            })
            res.status(200)
        }
    } catch (error) {
        res.status(500)
        console.error("error loading edit product",error)
    }
}

const editProduct = async (req, res) => {
    try {
        const formData = req.body; 
        const { id } = req.params; 
        console.log('Form data:', formData);
        console.log('Product ID:', id);

        const uploadedFiles = req.files; 
        console.log('Uploaded files:', uploadedFiles);

        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        let images = [...existingProduct.productImage];

        console.log('Raw removedImages string:', formData.removedImages);

        let removedImages = [];
        if (formData.removedImages) {
            try {
                const removedImagesArray = Array.isArray(formData.removedImages)
                    ? formData.removedImages 
                    : [formData.removedImages]; 

                removedImages = removedImagesArray.reduce((acc, jsonString) => {
                    return acc.concat(JSON.parse(jsonString));
                }, []);
            } catch (error) {
                console.error("Invalid JSON for removedImages:", error);
                return res.status(400).json({ success: false, message: "Invalid format for removed images." });
            }
        }
        console.log('Parsed removed images:', removedImages);

        if (removedImages.length > 0) {
            images = images.filter(image => !removedImages.includes(image));
        }

        if (uploadedFiles && uploadedFiles.length > 0) {
            for (let i = 0; i < uploadedFiles.length; i++) {
                const originalImagePath = uploadedFiles[i].path; 
                const resizedImagePath = path.join("Public", "upload", "product-images", uploadedFiles[i].filename); 

                await sharp(originalImagePath)
                    .resize({ width: 800, height: 800 })
                    .toFile(resizedImagePath);

                images.push(uploadedFiles[i].filename);
            }
        }

        await Product.updateOne(
            { _id: id },
            {
                $set: {
                    productName: formData.productName,
                    description: formData.productDescription,
                    brand: formData.productBrand,
                    category: formData.productCategory,
                    regularPrice: formData.regularPrice,
                    salePrice: formData.salePrice,
                    quantity: formData.quantity,
                    status: formData.status,
                    productImage: images, 
                }
            }
        );

        res.status(200).json({ success: true, message: 'Product updated successfully!' });

    } catch (error) {
        console.error("Error while editing product:", error);
        res.status(500).send("An error occurred while editing the product");
    }
};

module.exports = {
    loadProduct,
    loadAddProduct,
    addProduct,
    deleteProduct,
    blockProduct,
    unblockProduct,
    loadEditProduct,
    editProduct,
}
