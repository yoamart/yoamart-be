// @ts-nocheck

import { RequestHandler } from "express";
import Order from "#/model/order";
import User from "#/model/user";
import Shipping from "#/model/shipping";
import { deliveredOrderEmail, paymentConfirmationEmail, sendOrderConfirmationEmail, sendOrderConfirmationEmailAdmin, shippedOrderEmail } from "#/utils/mail";
import product from "#/model/product";
import { generateOrderNumber } from "#/utils/tokenHelper";

export const getAllUserOrders: RequestHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        // console.log(userId);

        const orders = await Order.find({ userId: userId });
        res.json({ orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }


    // try {
    //     const orders = await Order.aggregate([
    //         { $match: { userId: userId } }, // Filter orders by userId
    //         {
    //             $lookup: {
    //                 from: 'products', // Name of the product collection
    //                 localField: 'orderId', // Field from the Order collection
    //                 foreignField: '_id', // Field from the Product collection
    //                 as: 'order' // Output array field containing the product details
    //             }
    //         },
    //         { $unwind: '$order' }, // Unwind the product array to get individual product details
    //         {
    //             $project: {
    //                 _id: 0, // Exclude _id field
    //                 orderId: '$_id', // Rename _id field to orderId
    //                 productName: '$order.name',
    //                 productPrice: '$product.price',
    //                 productImage: '$product.image',
    //                 productQty: '$quantity',
    //                 address: '$address', // Include address field from Order collection
    //                 phone: '$phone' // Include phone field from Order collection
    //                 // Add more fields as needed
    //             }
    //         }
    //     ]);

    //     if (!orders) {
    //         return res.status(404).json({ message: "No orders found for the user" });
    //     }

    //     res.json({ orders });
    // } catch (error) {
    //     res.status(500).json({ message: "An error occurred while fetching user orders" });
    // }
};

export const getOrderById: RequestHandler = async (req, res) => {

    const userId = req.user.id;

    const user = await User.findOne({ _id: userId });
    if (!user) res.status(403).json({ error: "Unauthorized request!" })
    const orderId = req.params.orderId; // Access orderId directly from req.params

    const order = await Order.findOne({ userId: userId, _id: orderId });
    if (!order) return res.status(400).json({ message: "Cannot find order!" });

    try {
        const getOrder = await Order.aggregate([
            { $match: { _id: orderId } }, // Convert orderId to ObjectId
            {
                $lookup: {
                    from: 'products', // Name of the product collection
                    localField: 'productId', // Field from the Order collection
                    foreignField: '_id', // Field from the Product collection
                    as: 'product' // Output array field containing the product details
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    orderId: '$_id', // Rename _id field to orderId
                    productName: '$product.name',
                    productPrice: '$product.price',
                    productImage: '$product.image',
                    productQty: '$quantity',
                    address: '$address', // Include address field from Order collection
                    phone: '$phone', // Include phone field from Order collection
                    status: '$status',
                    orderNumber: '$orderNumber',
                    orderDate: '$orderDate',
                    note: '$note'
                    // Add more fields as needed

                }
            }
        ]);

        if (!getOrder) return res.status(400).json({ message: 'Something went wrong!' })

        res.json({ order });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({ message: "An error occurred while fetching order details" });
    }
};

export const confirmedOrderStatus: RequestHandler = async (req, res) => {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) return res.status(400).json({ message: "Cannot find order document!" });

    const shipping = await Shipping.findOne({ orderId });
    if (!shipping) return res.status(400).json({ message: "Cannot find shipping document!" });


    let productListTable = `
    <table width="100%" cellspacing="0" cellpadding="5" border="1" style="border: 1px solid #ddd; border-collapse: collapse; text-align: left;">
      <thead>
        <tr>
          <th style="padding: 8px; background-color: #f4f4f4;">Product</th>
          <th style="padding: 8px; background-color: #f4f4f4;">Quantity</th>
        </tr>
      </thead>
      <tbody>
    `;

    for (const cartItem of order.cart) {
        const productId = cartItem.id;
        const productExist = await product.findById(productId);

        if (!productExist) {
            return res.status(422).json({ message: `Product with ID: ${productId} not found` });
        }

        // Decrease product quantity and update top selling field
        const purchaseQuantity = parseInt(cartItem.quantity, 10); // Ensure quantity is a number


        // Add the product details in the HTML table row
        productListTable += `
          <tr>
              <td style="padding: 8px;">${productExist.name}</td>
              <td style="padding: 8px;">${purchaseQuantity}</td>
          </tr>
      `;
    }

    // Close the table structure
    productListTable += `
      </tbody>
    </table>
    `;





    if (order.orderStatus === "pending") {
        order.orderStatus = "shipped";
        shipping.status = 'shipped';
        order.updatedAt = new Date();

        const formattedOrderDate = new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(order?.updatedAt));

        await shippedOrderEmail(order.name, order.email, order.orderNumber, formattedOrderDate, productListTable);
    } else if (order.orderStatus === 'shipped') {
        order.orderStatus = 'completed';
        shipping.status = 'completed';
        order.updatedAt = new Date();

        const formattedOrderDate = new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(order?.updatedAt));

        await deliveredOrderEmail(order.name, order.email, order.orderNumber, formattedOrderDate, productListTable, order._id);
    } else {
        return res.status(400).json({ message: "Order already completed!" });
    }

    // // Update shipping status directly based on order status
    // if (shipping.status === 'pending') {
    //     shipping.status = 'shipped';
    // } else if (shipping.status === 'shipped') {
    //     shipping.status = 'completed';
    // } else {
    //     return res.status(400).json({ message: "Order already shipped!" });
    // }

    await order.save();
    // await shipping.save();

    res.json({ message: "Order confirmed and shipped successfully!" });
};


export const totalNumberOfOrders: RequestHandler = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        res.json({ totalOrders });
    } catch (error) {
        console.error("Error fetching total number of orders:", error);
        res.status(500).json({ message: "An error occurred while fetching total number of orders" });
    }
}

export const totalNumberOfConfirmedOrders: RequestHandler = async (req, res) => {
    const totalConfirmedOrders = await Order.countDocuments({ orderStatus: "confirmed" })
    res.json({ totalConfirmedOrders });
}

export const totalNumberOfShippedOrders: RequestHandler = async (req, res) => {
    const numberOfShippedOrders = await Shipping.countDocuments({ status: "shipped" });
    res.json({ numberOfShippedOrders });
}

export const totalNumberOfPendingOrders: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const user = await User.findOne({ _id: userId });
    if (!user) return res.status(403).json({ message: "Access denied!" });
    const numberOfPendingOrders = await Order.countDocuments({ orderStatus: "pending" })
    res.json({ numberOfPendingOrders });
}

export const totalNumberOfProcessingOrders: RequestHandler = async (req, res) => {
    const totalProcessing = await Order.countDocuments({ orderStatus: "processing" });
    res.json({ totalProcessing });
}

export const getAllOrders: RequestHandler = async (req, res) => {
    const allOrders = await Order.find().sort({ createdAt: -1 });
    if (!allOrders) return res.status(400).json({ message: "No order fetch" })
    res.json({ allOrders });
}


export const createOrder: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const userName = req.user.name;
    const userEmail = req.user.email;

    try {
        const { name, email, phone, address, cart: cartString, totalPrice } = req.body;

        // Parse the stringified cart into a JavaScript object
        const cart = JSON.parse(cartString);
        // console.log(cart)
        // Validate the parsed cart
        if (!cart || cart.length === 0) {
            return res.status(400).json({ message: "Cart is empty!" });
        }
        const orderNumber = generateOrderNumber(4);

        // Create a new order
        const order = new Order({
            userId,
            name,
            email,
            mobile: phone,
            address,
            total: totalPrice,
            cart,  // Save the parsed cart to the order
            orderStatus: "pending",
            isPaid: "unpaid",
            orderNumber,
        });


        // Save the order to the database
        await order.save();

        res.status(201).json({
            message: "Order created successfully!",
            orderId: order._id,
            order,
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Failed to create order" });
    }
};


export const updateOrderToProcessing: RequestHandler = async (req, res) => {
    const orderId = req.params.orderId;

    try {
        const { name, email, address, phone, note, orderNumber } = req.body;

        // Find the order by ID and order number
        const order = await Order.findOne({ _id: orderId, orderNumber });
        if (!order) {
            return res.status(404).json({ message: "Order not found!" });
        }

        // Update the order to "Processing" and fill in the provided details
        order.isPaid = "processing";
        order.name = name;
        order.email = email;
        order.mobile = phone;
        order.address = address;
        order.note = note;
        order.orderDate = new Date();


        await order.save();


        const shipping = new Shipping({
            orderId: order._id,
            name,
            email,
            address,
            phone,
            note,
        });
        await shipping.save();

        // Prepare product names and quantities for the email in HTML table format
        let productListTable = `
<table width="100%" cellspacing="0" cellpadding="5" border="1" style="border: 1px solid #ddd; border-collapse: collapse; text-align: left;">
  <thead>
    <tr>
      <th style="padding: 8px; background-color: #f4f4f4;">Product</th>
      <th style="padding: 8px; background-color: #f4f4f4;">Quantity</th>
    </tr>
  </thead>
  <tbody>
`;

        for (const cartItem of order.cart) {
            const productId = cartItem.id;
            const productExist = await product.findById(productId);

            if (!productExist) {
                return res.status(422).json({ message: `Product with ID: ${productId} not found` });
            }

            // Decrease product quantity and update top selling field
            const purchaseQuantity = parseInt(cartItem.quantity, 10); // Ensure quantity is a number
            productExist.quantity -= purchaseQuantity;
            productExist.topSelling = Math.max(productExist.topSelling, purchaseQuantity);

            // Mark the product as out of stock if needed
            if (productExist.quantity <= 0) {
                productExist.inStock = false;
            }

            // Save the updated product
            await productExist.save();

            // Add the product details in the HTML table row
            productListTable += `
      <tr>
          <td style="padding: 8px;">${productExist.name}</td>
          <td style="padding: 8px;">${purchaseQuantity}</td>
      </tr>
  `;
        }

        // Close the table structure
        productListTable += `
  </tbody>
</table>
`;

        const formattedOrderDate = new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(order?.orderDate));

        const formattedAmount = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(order.total);

        // Send order confirmation email with the HTML table
        await sendOrderConfirmationEmail(
            order.name,
            order.email,
            orderNumber,
            formattedOrderDate,
            productListTable,  // Send the table of products
            formattedAmount,   // Send the total amount
            order.cart.length   // Send the number of products in the order
        );

        await sendOrderConfirmationEmailAdmin(
            order.name,
            order.email,
            orderNumber,
            formattedOrderDate,
            productListTable,  // Send the table of products
            formattedAmount,     // Send the total amount
            order.cart.length     // Send the number of products in the order
        );

        res.status(200).json({
            message: "Order updated to processing successfully!",
            order,
        });
    } catch (error) {
        console.error("Error updating order to processing:", error);
        res.status(500).json({ message: "Failed to update order to processing" });
    }
};




export const confirmedOrderPaymentStatus: RequestHandler = async (req, res) => {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) return res.status(400).json({ message: "Cannot find order document!" });


    if (order.isPaid === "processing") {
        order.isPaid = "paid";
        order.updatedAt = new Date();

    } else {
        return res.status(400).json({ message: "Order payment already confirmed!" });
    }

    const formattedUpdatedAt = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(order.updatedAt);

    const formattedAmount = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
    }).format(order.total);

    await order.save();
    await paymentConfirmationEmail(order.name, order.email, order.orderNumber, formattedUpdatedAt, formattedAmount);

    res.json({ message: "Order payment verified successfully!" });
};



export const getSalesAndOrdersByMonth: RequestHandler = async (req, res) => {
    try {
        const salesData = await Order.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" }, // Group by the month of the createdAt date
                    totalSales: { $sum: "$total" }, // Sum the total sales
                    totalOrders: { $sum: 1 }, // Count the total number of orders
                },
            },
            {
                $sort: { _id: 1 }, // Sort by month
            },
        ]);

        // Format the response for frontend use
        const response = salesData.map((item) => ({
            month: new Date(0, item._id - 1).toLocaleString("default", {
                month: "long",
            }), // Convert month number to month name
            totalSales: item.totalSales,
            totalOrders: item.totalOrders,
        }));

        res.status(200).json({
            sales: response,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching sales data", error });
    }
};


import { RequestHandler } from "express";
import Order from "../models/Order";
import User from "../models/User";
import mongoose from "mongoose";

export const getDashboardSummary: RequestHandler = async (req, res) => {
    try {
        // Get the first day of the last month
        const now = new Date();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Query for total sales since last month
        const salesData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: firstDayLastMonth },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$total" },
                    totalOrders: { $sum: 1 },
                },
            },
        ]);

        const totalSales = salesData[0]?.totalSales || 0;
        const totalOrders = salesData[0]?.totalOrders || 0;

        // Query for total users
        const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });

        // Send response
        res.json({
            totalSales,
            totalOrders,
            totalUsers,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
};
