const Order = require("../../Models/orderSchema");
const Product = require("../../Models/productSchema");
const loadDashboard = async (req, res) => {
  try {
    const interval = "weekly";
    const salesData = await getSaleData(interval);
    const topSelling = await getTopSellingProducts();
    const topSellingCategories = await getBestSellingCategories();
    const topSellingBrands = await getBestSellingBrands();
    const labels = salesData.map(
      (item) => item.week || item.month || item.year
    );
    const counts = salesData.map((item) => item.salesCount);

    console.log(labels);

    res.render("adminDashBoard", {
      labels,
      counts,
      topSelling,
      topSellingCategories,
      topSellingBrands,
    });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).send("Internal Server Error");
  }
};

const updateChart = async (req, res) => {
  try {
    const { interval = "weekly" } = req.query;
    const salesData = await getSaleData(interval);
    const labels = salesData.map(
      (item) => item.week || item.month || item.year
    );
    const counts = salesData.map((item) => item.salesCount);

    console.log(labels);

    res.json({ labels, counts });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).send("Internal Server Error");
  }
};

async function getSaleData(interval) {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);

    let salesData = [];

    if (interval === "weekly") {
      for (let week = 1; week <= 4; week++) {
        const startOfWeek = new Date(
          currentYear,
          currentMonth,
          1 + (week - 1) * 7
        );
        const endOfWeek = new Date(
          currentYear,
          currentMonth,
          Math.min(
            startOfWeek.getDate() + 6,
            new Date(currentYear, currentMonth + 1, 0).getDate()
          )
        );

        const weeklySales = await Order.aggregate([
          {
            $match: {
              invoiceDate: { $gte: startOfWeek, $lte: endOfWeek },
              status: { $in: ["Delivered"] },
            },
          },
          {
            $group: {
              _id: null,
              salesCount: { $sum: 1 },
              totalSales: { $sum: "$finalAmount" },
            },
          },
        ]);

        salesData.push({
          week: `Week ${week}`,
          salesCount: weeklySales[0]?.salesCount || 0,
          totalSales: weeklySales[0]?.totalSales || 0,
        });
      }
    } else if (interval === "monthly") {
      for (let month = 0; month < 12; month++) {
        const startOfMonth = new Date(currentYear, month, 1);
        const endOfMonth = new Date(currentYear, month + 1, 0);

        const monthlySales = await Order.aggregate([
          {
            $match: {
              invoiceDate: { $gte: startOfMonth, $lte: endOfMonth },
              status: { $in: ["Delivered"] },
            },
          },
          {
            $group: {
              _id: null,
              salesCount: { $sum: 1 },
              totalSales: { $sum: "$finalAmount" },
            },
          },
        ]);

        salesData.push({
          month: startOfMonth.toLocaleString("default", { month: "short" }),
          salesCount: monthlySales[0]?.salesCount || 0,
          totalSales: monthlySales[0]?.totalSales || 0,
        });
      }
    } else if (interval === "yearly") {
      for (let year = currentYear - 5; year <= currentYear; year++) {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31);

        const yearlySales = await Order.aggregate([
          {
            $match: {
              invoiceDate: { $gte: startOfYear, $lte: endOfYear },
              status: { $in: ["Delivered"] },
            },
          },
          {
            $group: {
              _id: null,
              salesCount: { $sum: 1 },
              totalSales: { $sum: "$finalAmount" },
            },
          },
        ]);

        salesData.push({
          year,
          salesCount: yearlySales[0]?.salesCount || 0,
          totalSales: yearlySales[0]?.totalSales || 0,
        });
      }
    }

    return salesData;
  } catch (error) {
    console.error("somthing went wrong while getting Sale Data", error);
  }
}

async function getTopSellingProducts() {
  try {
    const topProducts = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $unwind: "$orderedItems",
      },
      {
        $group: {
          _id: "$orderedItems.product",
          totalQuantitySold: { $sum: "$orderedItems.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $sort: { totalQuantitySold: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 0,
          productName: "$productDetails.productName",
          brand: "$productDetails.brand",
          category: "$productDetails.category",
          totalQuantitySold: 1,
          productImage: "$productDetails.productImage",
        },
      },
    ]);

    console.log(topProducts);
    return topProducts;
  } catch (error) {
    console.error("Error fetching top-selling products:", error);
  }
}

const getBestSellingCategories = async () => {
  try {
    const bestSellingCategories = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $unwind: "$orderedItems",
      },
      {
        $lookup: {
          from: "products",
          localField: "orderedItems.product",
          foreignField: "_id",
          as: "productData",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productData.category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      {
        $unwind: "$categoryData",
      },
      {
        $group: {
          _id: "$categoryData.name",
          totalQuantitySold: { $sum: "$orderedItems.quantity" },
          totalRevenue: { $sum: "$orderedItems.price" },
        },
      },
      {
        $sort: { totalQuantitySold: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    return bestSellingCategories;
  } catch (error) {
    console.error("Error fetching best-selling categories:", error);
    throw error;
  }
};

const getBestSellingBrands = async () => {
  try {
    const bestSellingBrands = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $unwind: "$orderedItems",
      },

      {
        $lookup: {
          from: "products",
          localField: "orderedItems.product",
          foreignField: "_id",
          as: "productData",
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "productData.brand",
          foreignField: "_id",
          as: "brandData",
        },
      },
      {
        $unwind: "$brandData",
      },
      {
        $group: {
          _id: "$brandData.brandName",
          totalQuantitySold: { $sum: "$orderedItems.quantity" },
          totalRevenue: { $sum: "$orderedItems.price" },
        },
      },
      {
        $sort: { totalQuantitySold: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    return bestSellingBrands;
  } catch (error) {
    console.error("Error fetching best-selling brands:", error);
    throw error;
  }
};

module.exports = {
  loadDashboard,
  updateChart,
};
