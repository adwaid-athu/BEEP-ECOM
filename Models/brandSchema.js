const mongoose = require("mongoose");
const {Schema} = mongoose;


const brandSchema = new Schema({

    brandName : {
        type : String,
        required:true
    },
    isBlocked : {
        type : Boolean,
        default:false
    },
    createdAt: {
        type:Date,
        default:Date.now
    },
    offer:{
        type:Schema.Types.ObjectId,
        ref:"Offer"
        }

})

const Brand = mongoose.model("Brand",brandSchema);
module.exports = Brand;