const Order = require("../../Models/orderSchema");
const excelJS = require("exceljs");
const PDFDocument = require("pdfkit");
let startDate = "";
let endDate = "";

 
const loadReportPage = async (req, res) => {
  const { type = "daily", page = 1 } = req.query;
  startDate = req.query.startDate
  endDate = req.query.endDate
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    let match = {};

    const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    console.log("Detected Time Zone:", systemTimeZone);

    const today = new Date();
    const todayInTimeZone = new Intl.DateTimeFormat("en-IN", {
      timeZone: systemTimeZone,
    }).format(today);

    console.log("Formatted Today (in detected time zone):", todayInTimeZone);

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayInTimeZone = new Intl.DateTimeFormat("en-IN", {
      timeZone: systemTimeZone,
    }).format(startOfDay);

    console.log("Start of Day:", startOfDayInTimeZone);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfWeekInTimeZone = new Intl.DateTimeFormat("en-IN", {
      timeZone: systemTimeZone,
    }).format(startOfWeek);
    console.log("Start of Week:", startOfWeekInTimeZone);

    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const startOfYearInTimeZone = new Intl.DateTimeFormat("en-IN", {
      timeZone: systemTimeZone,
    }).format(startOfYear);

    console.log("Start of Year:", startOfYearInTimeZone);

    if (type === "daily") {
      if (startDate && endDate) {
        match.invoiceDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else {
        match.invoiceDate = { $lte: today };
      }
    } else if (type === "weekly") {
      if (startDate && endDate) {
        match.invoiceDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else {
        match.invoiceDate = { $lte: today };
      }
    } else if (type === "yearly") {
      match.invoiceDate = { $gte: startOfYear };
    } else if (type === "custom" && startDate && endDate) {
      match.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };

    }

    let groupByPeriod;
    if (type === "daily") {
      groupByPeriod = {
        $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" },
      };
    } else if (type === "weekly") {
      groupByPeriod = {
        $dateToString: { format: "%Y-%U", date: "$invoiceDate" },
      };
    } else if (type === "yearly") {
      groupByPeriod = { $year: "$invoiceDate" };
    }
    const salesData = await Order.aggregate([
      { $match: match },
      {
        $project: {
          invoiceDate: 1,
          finalAmount: 1,
          discount: { $ifNull: ["$discount", 0] },
        },
      },
      {
        $group: {
          _id: groupByPeriod,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmount" },
          totalDiscount: { $sum: "$discount" },
          netSales: {
            $sum: {
              $subtract: ["$finalAmount", { $ifNull: ["$discount", 0] }],
            },
          },
        },
      },
      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalSalesCount = await Order.aggregate([
      { $match: match },
      { $group: { _id: groupByPeriod } },
      { $count: "count" },
    ]);

    const totalPages = Math.ceil((totalSalesCount[0]?.count || 0) / limit);

    const renderData = {
      type:type,
      salesData: salesData.map((sale) => ({
        date: sale._id,
        totalOrders: sale.totalOrders,
        totalRevenue: sale.totalRevenue.toFixed(2),
        totalDiscount: sale.totalDiscount.toFixed(2),
        netSales: sale.netSales.toFixed(2),
      })),
      totalPages,
      currentPage: parseInt(page),
      type,
    };

    if (type === "custom") {
      renderData.startDate = startDate;
      renderData.endDate = endDate;
    }

    res.render("adminReport", renderData);
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).send("Server Error");
  }
};

const downloadExcel = async (req, res) => {
  const { type } = req.body;
  let match = {};

  if (type === "custom" && startDate && endDate) {
    match.invoiceDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  try {
    let aggregationPipeline = [];

    if (type === "daily") {
      aggregationPipeline = [
        { $match: match },
        {
          $project: {
            day: { $dayOfYear: "$invoiceDate" },
            year: { $year: "$invoiceDate" },
            finalAmount: 1,
            discount: { $ifNull: ["$discount", 0] },
            invoiceDate: 1,
          },
        },
        {
          $group: {
            _id: { day: "$day", year: "$year" },
            totalRevenue: { $sum: "$finalAmount" },
            totalDiscount: { $sum: "$discount" },
            netSales: { $sum: { $subtract: ["$finalAmount", "$discount"] } },
            orderCount: { $sum: 1 },
            date: { $first: "$invoiceDate" },
          },
        },
        { $sort: { "_id.year": 1, "_id.day": 1 } },
      ];
    } else if (type === "weekly") {
      aggregationPipeline = [
        { $match: match },
        {
          $project: {
            week: { $isoWeek: "$invoiceDate" },
            year: { $year: "$invoiceDate" },
            finalAmount: 1,
            discount: { $ifNull: ["$discount", 0] },
            invoiceDate: 1,
          },
        },
        {
          $group: {
            _id: { week: "$week", year: "$year" },
            totalRevenue: { $sum: "$finalAmount" },
            totalDiscount: { $sum: "$discount" },
            netSales: { $sum: { $subtract: ["$finalAmount", "$discount"] } },
            orderCount: { $sum: 1 },
            date: { $first: "$invoiceDate" },
          },
        },
        { $sort: { "_id.year": 1, "_id.week": 1 } },
      ];
    } else if (type === "yearly") {
      aggregationPipeline = [
        { $match: match },
        {
          $project: {
            year: { $year: "$invoiceDate" },
            finalAmount: 1,
            discount: { $ifNull: ["$discount", 0] },
            invoiceDate: 1,
          },
        },
        {
          $group: {
            _id: "$year",
            totalRevenue: { $sum: "$finalAmount" },
            totalDiscount: { $sum: "$discount" },
            netSales: { $sum: { $subtract: ["$finalAmount", "$discount"] } },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];
    } else {
      aggregationPipeline = [
        { $match: match },
        {
          $project: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" },
            },
            finalAmount: 1,
            discount: { $ifNull: ["$discount", 0] },
            invoiceDate: 1,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$finalAmount" },
            totalDiscount: { $sum: "$discount" },
            netSales: { $sum: { $subtract: ["$finalAmount", "$discount"] } },
            orderCount: { $sum: 1 },
            dateRange: {
              $push: "$date",
            },
          },
        },
      ];
    }

    const salesData = await Order.aggregate(aggregationPipeline);

    if (!salesData || salesData.length === 0) {
      return res
        .status(404)
        .send("No sales data available for the selected period.");
    }

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Date", key: "date", width: 20 },
      { header: "Total Revenue", key: "totalRevenue", width: 15 },
      { header: "Total Discount", key: "totalDiscount", width: 15 },
      { header: "Net Sales", key: "netSales", width: 15 },
    ];
 
    salesData.forEach((sale) => {
      let displayDate;
      if (type === "weekly") {
        displayDate = `${sale._id.year}-W${sale._id.week.toString().padStart(2, "0")}`;
      } else if (type === "yearly") {
        displayDate = `${sale._id}`;
      } else if (type === "custom") {
        console.log("Custom condition triggered");
        console.log(`Start Date: ${startDate}, End Date: ${endDate}`);
        if (!startDate || !endDate) {
          throw new Error("Start Date and End Date must be set for custom type");
        }
        displayDate = `${startDate} To ${endDate}`;
      } else {
        displayDate = new Date(sale.date).toISOString().split("T")[0];
      }
    
      worksheet.addRow({
        date: displayDate,
        totalRevenue: sale.totalRevenue.toFixed(2),
        totalDiscount: sale.totalDiscount.toFixed(2),
        netSales: sale.netSales.toFixed(2),
      });
    });
    

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.xlsx"
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).send("Failed to generate Excel file.");
  }
};




const downloadPDF = async (req, res) => {
    const { type} = req.body;
    let match = {};
  
    if (type === "custom" && startDate && endDate) {
        console.log(startDate,endDate);
        
      match.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
  
    try {
   
      let aggregationPipeline = [];
  
      if (type === "daily") {
        aggregationPipeline = [
          { $match: match },
          {
            $project: {
              day: { $dayOfYear: "$invoiceDate" },
              year: { $year: "$invoiceDate" },
              finalAmount: 1,
              discount: { $ifNull: ["$discount", 0] },
              invoiceDate: 1,
            },
          },
          {
            $group: {
              _id: { day: "$day", year: "$year" },
              totalRevenue: { $sum: "$finalAmount" },
              totalDiscount: { $sum: "$discount" },
              netSales: { $sum: { $subtract: ["$finalAmount", "$discount"] } },
              orderCount: { $sum: 1 },
              date: { $first: "$invoiceDate" },
            },
          },
          { $sort: { "_id.year": 1, "_id.day": 1 } },
        ];
      } else if (type === "weekly") {
        aggregationPipeline = [
          { $match: match },
          {
            $project: {
              week: { $isoWeek: "$invoiceDate" },
              year: { $year: "$invoiceDate" },
              finalAmount: 1,
              discount: { $ifNull: ["$discount", 0] },
              invoiceDate: 1,
            },
          },
          {
            $group: {
              _id: { week: "$week", year: "$year" },
              totalRevenue: { $sum: "$finalAmount" },
              totalDiscount: { $sum: "$discount" },
              netSales: { $sum: { $subtract: ["$finalAmount", "$discount"] } },
              orderCount: { $sum: 1 },
              date: { $first: "$invoiceDate" },
            },
          },
          { $sort: { "_id.year": 1, "_id.week": 1 } },
        ];
      } else if (type === "yearly") {
        aggregationPipeline = [
          { $match: match },
          {
            $project: {
              year: { $year: "$invoiceDate" },
              finalAmount: 1,
              discount: { $ifNull: ["$discount", 0] },
              invoiceDate: 1,
            },
          },
          {
            $group: {
              _id: "$year",
              totalRevenue: { $sum: "$finalAmount" },
              totalDiscount: { $sum: "$discount" },
              netSales: { $sum: { $subtract: ["$finalAmount", "$discount"] } },
              orderCount: { $sum: 1 },
              date: { $first: "$invoiceDate" },
            },
          },
          { $sort: { "_id": 1 } },
        ];
      } else{       
        aggregationPipeline = [
          { $match: match }, 
          {
            $project: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" }
              },
              finalAmount: 1,
              discount: { $ifNull: ["$discount", 0] },
              invoiceDate: 1,
            },
          },
          {
            $group: {
              _id:null,
              totalRevenue: { $sum: "$finalAmount" },
              totalDiscount: { $sum: "$discount" },
              netSales: { $sum: { $subtract: ["$finalAmount", "$discount"] } },
              orderCount: { $sum: 1 },
              date: { $first: "$invoiceDate" },
            },
          },
          { $sort: { _id: 1 } }, 
        ];
      }
      
  
      const salesData = await Order.aggregate(aggregationPipeline);
  
      if (!salesData || salesData.length === 0) {
        return res
          .status(404)
          .send("No sales data available for the selected period.");
      }

    const doc = new PDFDocument();
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");

    doc.pipe(res);

    doc.fontSize(16).text("Sales Report", { align: "center" });
    doc.moveDown();

    const reportTitle = type === "custom" 
      ? `Custom Report from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
      : `${type === "daily" ? "Daily Report" : type === "weekly" ? "Weekly Report" : "Yearly Report"}`;

    doc.fontSize(12).text(reportTitle, { align: "center" });
    doc.moveDown();

    const tableTop = 140;

    if(type==="custom"){
    var columnWidth=[150,120,120,120]
    }else{
     var columnWidth = [120, 120, 120, 120];
    }

    const rowHeight = 20;
    const margins = { left: 50, top: tableTop };

    if(type)
    doc.fontSize(12).text("Date", margins.left, margins.top);
    doc.text("Total Revenue", margins.left + columnWidth[0], margins.top);
    doc.text("Total Discount", margins.left + columnWidth[0] + columnWidth[1], margins.top);
    doc.text("Net Sales", margins.left + columnWidth[0] + columnWidth[1] + columnWidth[2], margins.top);
    
    doc.rect(margins.left, margins.top - 5, columnWidth[0], rowHeight).stroke();
    doc.rect(margins.left + columnWidth[0], margins.top - 5, columnWidth[1], rowHeight).stroke();
    doc.rect(margins.left + columnWidth[0] + columnWidth[1], margins.top - 5, columnWidth[2], rowHeight).stroke();
    doc.rect(margins.left + columnWidth[0] + columnWidth[1] + columnWidth[2], margins.top - 5, columnWidth[3], rowHeight).stroke();
   
    salesData.forEach((sale, index) => {
      const rowY = margins.top + rowHeight + (index * rowHeight);

      const displayDate = type === "weekly" 
        ? `${sale._id.year}-${sale._id.week.toString().padStart(2, '0')}` 
        : type === "yearly" 
        ? `${sale._id.year}`
        :type==="custom"
        ?`${startDate} To ${endDate}`
        : sale.date.toISOString().split("T")[0];

      doc.text(displayDate, margins.left, rowY);
      doc.text(sale.totalRevenue.toFixed(2), margins.left + columnWidth[0], rowY);
      doc.text(sale.totalDiscount.toFixed(2), margins.left + columnWidth[0] + columnWidth[1], rowY);
      doc.text(sale.netSales.toFixed(2), margins.left + columnWidth[0] + columnWidth[1] + columnWidth[2], rowY);

      doc.rect(margins.left, rowY - 5, columnWidth[0], rowHeight).stroke();
      doc.rect(margins.left + columnWidth[0], rowY - 5, columnWidth[1], rowHeight).stroke();
      doc.rect(margins.left + columnWidth[0] + columnWidth[1], rowY - 5, columnWidth[2], rowHeight).stroke();
      doc.rect(margins.left + columnWidth[0] + columnWidth[1] + columnWidth[2], rowY - 5, columnWidth[3], rowHeight).stroke();

      
    });

    doc.end();
  
    } catch (error) {
      console.error(error);
      return res.status(500).send("An error occurred while generating the PDF.");
    }
  };


  
  
module.exports = {
  loadReportPage,
  downloadExcel,
  downloadPDF,
};
