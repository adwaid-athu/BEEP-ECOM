const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: [1, 'Quantity cannot be less than 1'], 
        },
      },
    ],
    appliedCoupon: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

cartSchema.pre('find', function() {
  this.populate([
    {
      path: 'items.product',
      populate: [
        { path: 'brand', populate: { path: 'offer', model: 'Offer' } },
        { path: 'category', populate: { path: 'offer', model: 'Offer' } },
        { path: 'offer', model: 'Offer' }
      ]
    },
    {
      path: 'appliedCoupon',
      model: 'Coupon'
    }
  ]);
});

cartSchema.pre('findOne', function() {
  this.populate([
    {
      path: 'items.product',
      populate: [
        { path: 'brand', populate: { path: 'offer', model: 'Offer' } },
        { path: 'category', populate: { path: 'offer', model: 'Offer' } },
        { path: 'offer', model: 'Offer' }
      ]
    },
    {
      path: 'appliedCoupon',
      model: 'Coupon'
    }
  ]);
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
