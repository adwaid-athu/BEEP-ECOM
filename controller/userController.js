const loadUserHome = async  (req,res)=>{
try{
    res.render("home")
}catch(error){
    console.log("home page not found");
    res.status(500).send("server error")
    
}

}


module.exports = {loadUserHome,
    
}