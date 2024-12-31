const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  transactions: [
    {
      transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        auto: true,
      },
      type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      description: {
        type: String,
        trim: true,
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', 
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed',
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;
