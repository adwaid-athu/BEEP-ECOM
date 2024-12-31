const { session } = require("passport");
const User = require("../../Models/userSchema");

const loadAdminUsers = async (req, res) => {
    try {
        console.log(req.session);
        
        
        const search = req.query.search || "";
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 10;

       
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        
        const count = await User.countDocuments({
            isAdmin: false,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        });

        
        const totalPages = Math.ceil(count / limit);

        res.render("adminUsers", {
            data: userData,
            search: search,
            totalPages: totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error("Error loading admin users:", error);
        res.status(500).send("Internal Server Error");
    }
};

const blockUser=async(req,res)=>{

     const userId =req.body.userId
        const userdata = await User.findOne({_id:userId})
        if(userdata){
            var resp = await User.updateOne({_id:userId},{$set:{isBlocked:true}})
            if(resp){
               delete req.session.passport
               delete req.session.user
               req.session.save((err)=>{
                if(err){
                    console.error("Error Saving session",err)
                }else{
                    console.log("session updated succesfully.")
                    res.status(200).json({success:true})
                }
               })
            }
        }else{
            console.log("something went wrong");
        }
    
}
const unblockUser=async(req,res)=>{

    const userId =req.body.userId
        const userdata = await User.findOne({_id:userId})
        if(userdata){
            var resp = await User.updateOne({_id:userId},{$set:{isBlocked:false}})
            res.status(200).json({success:true})
        }else{
            console.log("something went wrong");
        }
}
const deleteUser = async (req,res)=>{
    const userId =req.body.userId
    const userdata = await User.findOne({_id:userId})
    if(userdata){
        var resp = await User.deleteOne({_id:userId})
    }else{
        console.log("something went wrong");
    }
    

}



module.exports = {
    loadAdminUsers,
    blockUser,
    unblockUser,
    deleteUser,
};
