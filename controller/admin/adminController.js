const { message } = require("statuses")
const User = require("../../Models/userSchema")
const bcrypt = require("bcrypt")


const loadAdminLogin = async (req,res)=>{
    try {
        res.render("adminLogin") 
    } catch (error) {
        
    }
   
}

const verifyAdmin = async (req,res)=>{
    try {
        const {email,password} = req.body
        const user = await User.findOne({email})
        if(user){
           const passCheck = await bcrypt.compare(password,user.password)
           if(user.isAdmin){
            if(passCheck){
            req.session.adminData = {email:user.email,Id:user.id}
            return res.status(200).json({success:true})
            }else{
                return res.status(400).json({message:"Incorrect Password"})
            }
           }else{
            return res.status(400).json({adminMessage:"Admin Not Found"})
           }
        }else{
            return res.status(400).json({adminMessage:"Admin Not Found"})
        }
    } catch (error) {
        console.error("Admin Verification Failed",error) 
        res.status(500).json({message:"Server Error"})  
    }
}

const loadAdminDashboard = async(req,res)=>{
    try {
        res.render("adminDashboard")  
    } catch (error) {
        
    }
}

const adminLogout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Failed to destroy session:", err);
        return res.status(500).send("Failed to destroy session");
      }
  
      res.clearCookie("connect.sid");
      res.redirect("/admin");
    });
  };
  



module.exports = {
    
    loadAdminLogin,
    verifyAdmin,
    loadAdminDashboard,
    adminLogout,


}