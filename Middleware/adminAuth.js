function isAdminLoggedIn(req, res, next) {
    try {
        if (req.session.adminData) {
            next(); 
        } else {
            res.redirect("/admin"); 
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error"); 
    }
}
function isAdminLoggedOut(req, res, next) {
    try {
        if (!req.session.adminData) {
            next(); 
        } else {
            res.redirect("/admin/dashboard"); 
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error"); 
}

}

module.exports = {
    isAdminLoggedOut,
    isAdminLoggedIn,
}