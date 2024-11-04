const Address = require("../../Models/addressSchema")
const Order = require("../../Models/orderSchema")
const User = require("../../Models/userSchema.js")


const loadOrder = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 10; 
        const skip = (page - 1) * limit; 

        
        const orders = await Order.find() 
            .skip(skip)
            .limit(limit)
            .lean(); 
            
        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit); 

        res.render("adminOrder", {
            data: orders,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error("Error loading orders:", error);
        res.status(500).send("Internal Server Error"); 
    }
};

const loadViewOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        const order = await Order.findOne({ orderId: orderId }).populate("orderedItems.product");

        if (!order) {
            req.session.error_msg = "Order not found."; 
            return res.redirect("/admin/orders");
        }

        res.render("orderView", { order });
    } catch (error) {
        console.error("Error loading order:", error);
        req.session.error_msg = "An error occurred while loading the order."; 
        res.redirect("/admin/orders");
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const newStatus = req.body.status;

        const order = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });

        if (!order) {
            return res.status(404).json({ error: "Order not found." });
        }

        res.status(200).json({ message: "Order status updated successfully." });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "An error occurred while updating the order status." });
    }
};
    const cancelOrder = async (req, res) => {
    const { orderId } = req.body;
    

    try {
        // Find the order by ID and update its status
        const order = await Order.findOneAndUpdate({orderId:orderId}, { status: 'Cancelled' }, { new: true });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, message: 'Order canceled successfully' });
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).json({ success: false, message: 'An error occurred while canceling the order' });
    }
};
const deleteOrder = async (req, res) => {
    const { orderId } = req.body;
    

    try {
        // Find the order by ID and update its status
        const order = await Order.findOneAndDelete({orderId:orderId});

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the order' });
    }
};

module.exports = {
    loadOrder,
    loadViewOrder,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
}