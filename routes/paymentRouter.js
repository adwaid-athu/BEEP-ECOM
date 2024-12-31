const express = require('express');
const paymentController = require('../controller/user/paymentController');
const router = express.Router();

router.post('/createOrder',paymentController.createOrder);
router.post("/updateStockAndClear",paymentController.updateStockAndClearCart)
router.post("/continuePayment",paymentController.continuePayment)
router.post("/orderStatusUpdate",paymentController.updateOrderStatus)


module.exports = router;
