const mongoose = require("mongoose");
const {Schema} = mongoose;
const {v4:uuidv4} = require('uuid');

const orderSchema = new Schema({
    userId :{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    orderId : {
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    orderedItems:[{

        product:{
            type:Schema.Types.ObjectId,
            ref:'Product',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },

    }],
    paymentMethod:{
        type:String,
        required:true,
    },
    totalPrice:{
        type:Number,
        min:0
    },
    discount:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true,
        min:0
    },
    address:{
        type:Object,
        required:true
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    status:{
        type:String,
        required:true,
        enum:['Pending','Processing','Shipped','Delivered','Cancelled','Return Request','Returned']
    },
    createdOn :{
        type:Date,
        default:Date.now,
        required:true
    },
    couponApplied:{
        type:Boolean,
        default:false
    }
})

const Order = mongoose.model("Order",orderSchema);
module.exports = Order;