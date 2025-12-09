import orderModel from "../models/OrderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/ProductModel.js";
import razorpay from "razorpay";
import sendEmail from "../service/sendEmail.js";
// placing orders using COD METHOD

const currency='inr'
const deliveryCharges=10

/// gateway intialization


const razorpayInstance =new razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
})
const placeOrder=async(req,res)=>{



    
try{


    const {userId,items,amount,address}=req.body;

    const orderData={
        userId,
        items,
        address,
        amount,
        paymentMethod:"COD",
        payment:false,
        date:Date.now(),
     
    }


 const newOrder=new orderModel(orderData);
    await newOrder.save();

    // Decrease product stock for each item
    for(const item of items){
        await productModel.findByIdAndUpdate(item._id, {
            $inc: { quantity: -item.quantity }
        });
    }

    await userModel.findByIdAndUpdate(userId,{cartData:{}})

    res.json({success:true,message:"Order Placed "});



}catch(err){        
    console.log(err);
    res.status(500).json({success:false,error:err.message});    

}

}
// placing orders using STRIPE METHOD

const placeOrderStripe=async(req,res)=>{
    
try{


}catch(err){        
    console.log(err);
    res.status(500).json({success:false,error:err.message});    

}

}

// placing orders using RAZORPAY METHOD
const placeOrderRazorpay=async(req,res)=>{
    
try{

    const {userId,items,amount,address}=req.body;
    const {origin}=req.headers;

    const orderData={
        userId,
        items,
        address,
        amount,
        paymentMethod:"Razorpay",
        payment:false,
        date:Date.now(),
    }
    const newOrder=new orderModel(orderData);
    await newOrder.save();

     const options={
        amount:amount*100,
        currency:currency.toUpperCase(),
        receipt:newOrder._id.toString(),
     }

     await razorpayInstance.orders.create(options,(err,order)=>{

        if(err){
           console.log(err);
              return res.status(500).json({success:false,message:err.message});
        }

        res.json({success:true,order})


     })

    

}catch(err){        
    console.log(err);
    res.status(500).json({success:false,error:err.message});    

}

}

const verifyRazor=async(req,res)=>{
     try{

        const {response}=req.body;
        const {razorpay_order_id} = response ;

        console.log("Verify Razorpay request:", req.body);

        if(!razorpay_order_id){
            return res.status(400).json({success:false,message:"Order ID is required"});
        }

        const orderInfo=await razorpayInstance.orders.fetch(razorpay_order_id); 
        console.log("Order Info:", orderInfo);
        
         if(orderInfo.status==="paid"){
            await orderModel.findByIdAndUpdate(orderInfo.receipt,{payment:true});
            const userId = req.body.userId || req.userId;
            if(userId){
                await userModel.findByIdAndUpdate(userId,{cartData:{}});
            }
            
            // Decrease product stock for each item in the order
            const order = await orderModel.findById(orderInfo.receipt);
            if(order && order.items){
                for(const item of order.items){
                    await productModel.findByIdAndUpdate(item._id, {
                        $inc: { quantity: -item.quantity }
                    });
                }
            }
            
            // Send payment confirmation email
            try {
                const orderWithItems = await orderModel.findById(orderInfo.receipt).populate('items');
                const user = await userModel.findById(userId);
                
                if(user && user.email) {
                    const itemsHtml = orderWithItems.items.map(item => `
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name || 'Product'}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.size || 'N/A'}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity || 1}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${item.price || 0}</td>
                        </tr>
                    `).join('');
                    
                    const emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #4CAF50;">Payment Successful! 🎉</h2>
                            <p>Dear ${user.name || 'Customer'},</p>
                            <p>Your payment has been successfully processed. Thank you for your order!</p>
                            
                            <h3>Order Details:</h3>
                            <p><strong>Order ID:</strong> ${orderWithItems._id}</p>
                            <p><strong>Payment Method:</strong> ${orderWithItems.paymentMethod}</p>
                            <p><strong>Order Date:</strong> ${new Date(orderWithItems.date).toLocaleDateString()}</p>
                            
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <thead>
                                    <tr style="background-color: #f2f2f2;">
                                        <th style="padding: 10px; text-align: left;">Item</th>
                                        <th style="padding: 10px; text-align: left;">Size</th>
                                        <th style="padding: 10px; text-align: left;">Quantity</th>
                                        <th style="padding: 10px; text-align: left;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                            
                            <p><strong>Total Amount:</strong> ₹${orderWithItems.amount}</p>
                            
                            <h3>Shipping Address:</h3>
                            <p>
                                ${orderWithItems.address.firstName} ${orderWithItems.address.lastName}<br>
                                ${orderWithItems.address.street}<br>
                                ${orderWithItems.address.city}, ${orderWithItems.address.state} - ${orderWithItems.address.zipcode}<br>
                                Phone: ${orderWithItems.address.phone}
                            </p>
                            
                            <p style="margin-top: 30px;">We'll notify you once your order is shipped.</p>
                            <p>Best regards,<br>YourCampusMerch Team</p>
                        </div>
                    `;
                    
                    await sendEmail({
                        sendTo: user.email,
                        subject: 'Payment Confirmed - Order #' + orderWithItems._id,
                        html: emailHtml
                    });
                }
            } catch (emailErr) {
                console.error('Error sending payment confirmation email:', emailErr);
            }
            
            res.json({success:true,message:"Payment Successful" });
         }else{
            res.json({success:false,message:"Payment Failed"});
         }

     }catch(err){
        console.log(err);
        res.status(500).json({success:false,error:err.message});    
     }
}

// All orders data for admin panel 

const allOrders=async(req,res)=>{
    try{

        const orders = await orderModel.find({});
        res.json({success:true,orders});
    }catch(err){
        console.log(err);
        res.status(500).json({success:false,error:err.message});    
    }
}

// user order Data for frontend 
const userOrders=async(req,res)=>{
    try{
      

      const {userId}=req.body;

      const orders=await orderModel.find({userId});  
      
       res.json({success:true,orders});

    }catch(err){
        console.log(err);
        res.status(500).json({success:false,error:err.message});    
    }
}


// update order status fom admin panel

const updateStatus=async(req,res)=>{
    try{    

         const {orderId,status}=req.body;
        
        await orderModel.findByIdAndUpdate(orderId,{status});
        
        // Send order status update email
        try {
            const order = await orderModel.findById(orderId);
            const user = await userModel.findById(order.userId);
            
            if(user && user.email) {
                const itemsHtml = order.items.map(item => `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name || 'Product'}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.size || 'N/A'}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity || 1}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${item.price || 0}</td>
                    </tr>
                `).join('');
                
                let emailHtml = '';
                let subject = '';
                
                // Create unique templates for each status
                if(status === 'Order Placed') {
                    subject = `Order Confirmed - #${order._id}`;
                    emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #4CAF50; border-radius: 10px;">
                            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h1 style="margin: 0;">✅ Order Confirmed!</h1>
                            </div>
                            <div style="padding: 30px;">
                                <p style="font-size: 16px;">Dear ${user.name || 'Customer'},</p>
                                <p style="font-size: 16px;">Thank you for your order! We've received your order and will start processing it soon.</p>
                                
                                <div style="background-color: #E8F5E9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                                    <h3 style="margin-top: 0; color: #4CAF50;">Order ID: ${order._id}</h3>
                                    <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
                                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                                    <p><strong>Payment Status:</strong> ${order.payment ? '✓ Paid' : 'Pending'}</p>
                                </div>
                                
                                <h3>Order Items:</h3>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                    <thead>
                                        <tr style="background-color: #f2f2f2;">
                                            <th style="padding: 10px; text-align: left;">Item</th>
                                            <th style="padding: 10px; text-align: left;">Size</th>
                                            <th style="padding: 10px; text-align: left;">Qty</th>
                                            <th style="padding: 10px; text-align: left;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                </table>
                                
                                <div style="text-align: right; font-size: 18px; font-weight: bold; margin: 20px 0;">
                                    Total: ₹${order.amount}
                                </div>
                                
                                <h3>Delivery Address:</h3>
                                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50;">
                                    <p style="margin: 5px 0;"><strong>${order.address.firstName} ${order.address.lastName}</strong></p>
                                    <p style="margin: 5px 0;">${order.address.street}</p>
                                    <p style="margin: 5px 0;">${order.address.city}, ${order.address.state} - ${order.address.zipcode}</p>
                                    <p style="margin: 5px 0;">📞 ${order.address.phone}</p>
                                </div>
                                
                                <div style="margin-top: 30px; padding: 20px; background-color: #FFF3CD; border-radius: 5px;">
                                    <p style="margin: 0;"><strong>What's Next?</strong></p>
                                    <p style="margin: 10px 0 0 0;">We'll send you an email once your order is packed and ready to ship.</p>
                                </div>
                                
                                <p style="margin-top: 30px;">Thank you for shopping with us!</p>
                                <p style="color: #666;">Best regards,<br><strong>YourCampusMerch Team</strong></p>
                            </div>
                        </div>
                    `;
                } else if(status === 'Packing') {
                    subject = `Your Order is Being Packed - #${order._id}`;
                    emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #FF9800; border-radius: 10px;">
                            <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h1 style="margin: 0;">📦 Packing Your Order!</h1>
                            </div>
                            <div style="padding: 30px;">
                                <p style="font-size: 16px;">Dear ${user.name || 'Customer'},</p>
                                <p style="font-size: 16px;">Great news! Your order is now being carefully packed by our team.</p>
                                
                                <div style="background-color: #FFF3E0; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                                    <div style="font-size: 48px; margin-bottom: 10px;">📦</div>
                                    <h3 style="margin: 10px 0; color: #FF9800;">Currently Packing</h3>
                                    <p style="margin: 5px 0;">Order ID: ${order._id}</p>
                                </div>
                                
                                <h3>Items Being Packed:</h3>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                    <thead>
                                        <tr style="background-color: #f2f2f2;">
                                            <th style="padding: 10px; text-align: left;">Item</th>
                                            <th style="padding: 10px; text-align: left;">Size</th>
                                            <th style="padding: 10px; text-align: left;">Qty</th>
                                            <th style="padding: 10px; text-align: left;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                </table>
                                
                                <div style="text-align: right; font-size: 18px; font-weight: bold; margin: 20px 0;">
                                    Total: ₹${order.amount}
                                </div>
                                
                                <h3>Shipping To:</h3>
                                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF9800;">
                                    <p style="margin: 5px 0;"><strong>${order.address.firstName} ${order.address.lastName}</strong></p>
                                    <p style="margin: 5px 0;">${order.address.street}</p>
                                    <p style="margin: 5px 0;">${order.address.city}, ${order.address.state} - ${order.address.zipcode}</p>
                                    <p style="margin: 5px 0;">📞 ${order.address.phone}</p>
                                </div>
                                
                                <div style="margin-top: 30px; padding: 20px; background-color: #E3F2FD; border-radius: 5px;">
                                    <p style="margin: 0;"><strong>What's Next?</strong></p>
                                    <p style="margin: 10px 0 0 0;">Once packed, your order will be handed over to our shipping partner. We'll notify you with tracking details!</p>
                                </div>
                                
                                <p style="margin-top: 30px;">Thank you for your patience!</p>
                                <p style="color: #666;">Best regards,<br><strong>YourCampusMerch Team</strong></p>
                            </div>
                        </div>
                    `;
                } else if(status === 'Shipped') {
                    subject = `Your Order Has Been Shipped! 🚚 - #${order._id}`;
                    emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #2196F3; border-radius: 10px;">
                            <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h1 style="margin: 0;">🚚 Your Order is On Its Way!</h1>
                            </div>
                            <div style="padding: 30px;">
                                <p style="font-size: 16px;">Dear ${user.name || 'Customer'},</p>
                                <p style="font-size: 16px;">Exciting news! Your order has been shipped and is on its way to you.</p>
                                
                                <div style="background-color: #E3F2FD; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                                    <div style="font-size: 48px; margin-bottom: 10px;">🚚</div>
                                    <h3 style="margin: 10px 0; color: #2196F3;">In Transit</h3>
                                    <p style="margin: 5px 0;">Order ID: ${order._id}</p>
                                    <p style="margin: 5px 0;">Shipped on: ${new Date().toLocaleDateString()}</p>
                                </div>
                                
                                <h3>Shipped Items:</h3>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                    <thead>
                                        <tr style="background-color: #f2f2f2;">
                                            <th style="padding: 10px; text-align: left;">Item</th>
                                            <th style="padding: 10px; text-align: left;">Size</th>
                                            <th style="padding: 10px; text-align: left;">Qty</th>
                                            <th style="padding: 10px; text-align: left;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                </table>
                                
                                <div style="text-align: right; font-size: 18px; font-weight: bold; margin: 20px 0;">
                                    Total: ₹${order.amount}
                                </div>
                                
                                <h3>Delivery Address:</h3>
                                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2196F3;">
                                    <p style="margin: 5px 0;"><strong>${order.address.firstName} ${order.address.lastName}</strong></p>
                                    <p style="margin: 5px 0;">${order.address.street}</p>
                                    <p style="margin: 5px 0;">${order.address.city}, ${order.address.state} - ${order.address.zipcode}</p>
                                    <p style="margin: 5px 0;">📞 ${order.address.phone}</p>
                                </div>
                                
                                <div style="margin-top: 30px; padding: 20px; background-color: #FFF3CD; border-radius: 5px;">
                                    <p style="margin: 0;"><strong>📍 Track Your Order</strong></p>
                                    <p style="margin: 10px 0 0 0;">Your package is in transit. We'll notify you when it's out for delivery!</p>
                                </div>
                                
                                <p style="margin-top: 30px;">Get ready to receive your order soon!</p>
                                <p style="color: #666;">Best regards,<br><strong>YourCampusMerch Team</strong></p>
                            </div>
                        </div>
                    `;
                } else if(status === 'Out for delivery') {
                    subject = `Your Order is Out for Delivery Today! 🎉 - #${order._id}`;
                    emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #9C27B0; border-radius: 10px;">
                            <div style="background-color: #9C27B0; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h1 style="margin: 0;">🎉 Out for Delivery Today!</h1>
                            </div>
                            <div style="padding: 30px;">
                                <p style="font-size: 16px;">Dear ${user.name || 'Customer'},</p>
                                <p style="font-size: 16px; font-weight: bold;">Your order is out for delivery and will reach you today!</p>
                                
                                <div style="background-color: #F3E5F5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                                    <div style="font-size: 48px; margin-bottom: 10px;">🚴</div>
                                    <h3 style="margin: 10px 0; color: #9C27B0;">Out for Delivery</h3>
                                    <p style="margin: 5px 0;">Order ID: ${order._id}</p>
                                    <p style="margin: 5px 0; font-weight: bold; color: #9C27B0;">Expected Today!</p>
                                </div>
                                
                                <div style="background-color: #FFE082; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                                    <p style="margin: 0; font-weight: bold; font-size: 16px;">⏰ Please be available to receive your order</p>
                                    <p style="margin: 10px 0 0 0;">Our delivery partner will reach you soon!</p>
                                </div>
                                
                                <h3>Order Items:</h3>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                    <thead>
                                        <tr style="background-color: #f2f2f2;">
                                            <th style="padding: 10px; text-align: left;">Item</th>
                                            <th style="padding: 10px; text-align: left;">Size</th>
                                            <th style="padding: 10px; text-align: left;">Qty</th>
                                            <th style="padding: 10px; text-align: left;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                </table>
                                
                                <div style="text-align: right; font-size: 18px; font-weight: bold; margin: 20px 0;">
                                    Total: ₹${order.amount}
                                </div>
                                
                                <h3>Delivery Address:</h3>
                                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #9C27B0;">
                                    <p style="margin: 5px 0;"><strong>${order.address.firstName} ${order.address.lastName}</strong></p>
                                    <p style="margin: 5px 0;">${order.address.street}</p>
                                    <p style="margin: 5px 0;">${order.address.city}, ${order.address.state} - ${order.address.zipcode}</p>
                                    <p style="margin: 5px 0;">📞 ${order.address.phone}</p>
                                </div>
                                
                                <div style="margin-top: 30px; padding: 20px; background-color: #E8F5E9; border-radius: 5px;">
                                    <p style="margin: 0;"><strong>💡 Delivery Tips:</strong></p>
                                    <ul style="margin: 10px 0 0 20px; padding: 0;">
                                        <li>Please keep your phone handy</li>
                                        <li>Have a valid ID ready for verification</li>
                                        <li>Payment: ${order.payment ? 'Already Paid' : 'Cash on Delivery'}</li>
                                    </ul>
                                </div>
                                
                                <p style="margin-top: 30px;">Almost there! Thank you for your patience.</p>
                                <p style="color: #666;">Best regards,<br><strong>YourCampusMerch Team</strong></p>
                            </div>
                        </div>
                    `;
                } else if(status === 'Delivered') {
                    subject = `Order Delivered Successfully! ✅ - #${order._id}`;
                    emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #4CAF50; border-radius: 10px;">
                            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h1 style="margin: 0;">✅ Order Delivered!</h1>
                            </div>
                            <div style="padding: 30px;">
                                <p style="font-size: 16px;">Dear ${user.name || 'Customer'},</p>
                                <p style="font-size: 16px; font-weight: bold;">Your order has been delivered successfully! 🎉</p>
                                
                                <div style="background-color: #E8F5E9; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                                    <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                                    <h3 style="margin: 10px 0; color: #4CAF50;">Successfully Delivered</h3>
                                    <p style="margin: 5px 0;">Order ID: ${order._id}</p>
                                    <p style="margin: 5px 0;">Delivered on: ${new Date().toLocaleDateString()}</p>
                                </div>
                                
                                <div style="background-color: #FFF9C4; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                                    <p style="margin: 0; font-size: 16px;">⭐ We hope you love your purchase! ⭐</p>
                                    <p style="margin: 10px 0 0 0;">Please share your feedback with us.</p>
                                </div>
                                
                                <h3>Delivered Items:</h3>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                    <thead>
                                        <tr style="background-color: #f2f2f2;">
                                            <th style="padding: 10px; text-align: left;">Item</th>
                                            <th style="padding: 10px; text-align: left;">Size</th>
                                            <th style="padding: 10px; text-align: left;">Qty</th>
                                            <th style="padding: 10px; text-align: left;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                </table>
                                
                                <div style="text-align: right; font-size: 18px; font-weight: bold; margin: 20px 0;">
                                    Total: ₹${order.amount}
                                </div>
                                
                                <h3>Delivered To:</h3>
                                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50;">
                                    <p style="margin: 5px 0;"><strong>${order.address.firstName} ${order.address.lastName}</strong></p>
                                    <p style="margin: 5px 0;">${order.address.street}</p>
                                    <p style="margin: 5px 0;">${order.address.city}, ${order.address.state} - ${order.address.zipcode}</p>
                                    <p style="margin: 5px 0;">📞 ${order.address.phone}</p>
                                </div>
                                
                                <div style="margin-top: 30px; padding: 20px; background-color: #E1F5FE; border-radius: 5px;">
                                    <p style="margin: 0;"><strong>🛡️ Need Help?</strong></p>
                                    <p style="margin: 10px 0 0 0;">If you have any issues with your order, please contact our support team within 7 days.</p>
                                </div>
                                
                                <div style="margin-top: 20px; padding: 20px; background-color: #F3E5F5; border-radius: 5px; text-align: center;">
                                    <p style="margin: 0; font-weight: bold;">💝 Thank You for Shopping with Us!</p>
                                    <p style="margin: 10px 0 0 0;">We look forward to serving you again.</p>
                                </div>
                                
                                <p style="margin-top: 30px;">Enjoy your purchase!</p>
                                <p style="color: #666;">Best regards,<br><strong>YourCampusMerch Team</strong></p>
                            </div>
                        </div>
                    `;
                } else {
                    // Default template for any other status
                    subject = `Order Status Update - ${status} - #${order._id}`;
                    emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #757575; border-radius: 10px;">
                            <div style="background-color: #757575; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h1 style="margin: 0;">Order Status Update</h1>
                            </div>
                            <div style="padding: 30px;">
                                <p style="font-size: 16px;">Dear ${user.name || 'Customer'},</p>
                                <p style="font-size: 16px;">Your order status has been updated to: <strong>${status}</strong></p>
                                
                                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                                    <h3 style="margin-top: 0;">Order ID: ${order._id}</h3>
                                    <p><strong>Current Status:</strong> ${status}</p>
                                </div>
                                
                                <h3>Order Items:</h3>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                    <thead>
                                        <tr style="background-color: #f2f2f2;">
                                            <th style="padding: 10px; text-align: left;">Item</th>
                                            <th style="padding: 10px; text-align: left;">Size</th>
                                            <th style="padding: 10px; text-align: left;">Qty</th>
                                            <th style="padding: 10px; text-align: left;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                </table>
                                
                                <p style="margin-top: 30px;">Thank you for shopping with us!</p>
                                <p style="color: #666;">Best regards,<br><strong>YourCampusMerch Team</strong></p>
                            </div>
                        </div>
                    `;
                }
                
                await sendEmail({
                    sendTo: user.email,
                    subject: subject,
                    html: emailHtml
                });
            }
        } catch (emailErr) {
            console.error('Error sending order status email:', emailErr);
        }
        
        res.json({success:true,message:"Status updated"});
        
        }catch(err){
        console.log(err);
        res.status(500).json({success:false,error:err.message});    
    }
}


export {placeOrder,placeOrderStripe,placeOrderRazorpay,allOrders,userOrders,updateStatus,verifyRazor};
