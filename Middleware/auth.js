function isLoggedIn(req, res, next) {
    try {
        if (req.session.userData || req.session.user) {
            next(); 
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
            next(); 
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
            next()
        }else{
            res.redirect("/")
        }
    }catch (error) {
        console.log(error.message);
    }
}



module.exports = {isLoggedIn,isLoggedOut,OTPcheck }