
const User = require("../Models/userSchema")


function isLoggedIn(req, res, next) {
    try {
        if (req.session.userData || req.session.user) {
             return next(); 
        } else {
            res.redirect("/login"); 
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error"); 
    }
}
function isLoggedOut(req, res, next) {
    try {
        if (!req.session.userData && !req.session.user) {
             return next(); 
        } else {
            res.redirect("/"); 
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error"); 
}

}

function OTPcheck(req,res,next){
    try{
        if(req.session.otp){
           return  next()
        }else{
            console.log("no otp found")
            res.redirect("/")
        }
    }catch (error) {
        console.log(error.message);
    }
}

function isBlocked(req,res,next){
    try{
        const user=req.session.user
        if(user){
            const userData = User.findById(user)
            if(userData.isBlocked){
                res.redirect("/")
            }            
            return next()
        }
        res.redirect("/")
    }catch{

    }
}




module.exports = {isLoggedIn,isLoggedOut,OTPcheck,isBlocked}