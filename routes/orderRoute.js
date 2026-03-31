import express from 'express';

import {placeOrder,placeOrderStripe,placeOrderRazorpay,allOrders,userOrders,updateStatus, verifyRazor, getOrderTracking, deleteOrder, updatePaymentStatus} from '../controllers/orderController.js';
import adminAuth from '../middleware/adminAuth.js';
import authuser from '../middleware/auth.js';

const OrderRouter=express.Router();

// Admin Features
OrderRouter.post('/list',adminAuth,allOrders);
OrderRouter.put('/status',adminAuth,updateStatus);
OrderRouter.post('/delete',adminAuth,deleteOrder);
OrderRouter.put('/payment-status',adminAuth,updatePaymentStatus);


// payment Features
OrderRouter.post('/place',authuser,placeOrder);
OrderRouter.post('/stripe',authuser,placeOrderStripe);
OrderRouter.post('/razorpay',authuser,placeOrderRazorpay);

// User Features
OrderRouter.post('/userorders',authuser,userOrders);

// verify Razorpay payment
OrderRouter.post('/verifyRazorpay',authuser,verifyRazor);

// Get order tracking
OrderRouter.get('/tracking/:orderId',authuser,getOrderTracking);


export default OrderRouter;