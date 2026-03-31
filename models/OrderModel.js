import mongoose from "mongoose";


const orderSchema = new mongoose.Schema({
 userId: {type:String,required:true},
    items: {type:Array,required:true},
    amount: {type:Number,required:true},
    address: {type:Object,required:true},
    status: {type:String,required:true,default:"Order Placed"},
    paymentMethod: {type:String,required:true},
    payment: {type:Boolean,required:true,default:false},
    /** Set when Razorpay payment succeeds — used for refunds */
    razorpay_order_id: {type:String},
    razorpay_payment_id: {type:String},
    date: {type:Number,required:true},
    shippingFee: {type:Number,default:100},
    // Shiprocket shipping fields
    shiprocket_order_id: {type:Number},
    shipment_id: {type:Number},
    awb_code: {type:String},
    courier_name: {type:String},
    tracking_url: {type:String},
});


const orderModel=mongoose.model.order || mongoose.model('orders',orderSchema);

export default orderModel;

