import { createShiprocketClient } from '../config/shiprocket.js';
import orderModel from '../models/OrderModel.js';

// 1. Check serviceability and get shipping charges
export const checkServiceability = async (req, res) => {
    try {
        const { pickup_postcode, delivery_postcode, weight, cod } = req.body;
       
        const client = await createShiprocketClient();
        
        const response = await client.get('/courier/serviceability/', {
            params: {
                pickup_postcode,
                delivery_postcode,
                weight,
                cod: cod ? 1 : 0
            }
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Serviceability check error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to check serviceability'
        });
    }
};

// 2. Create Shiprocket order
export const createShiprocketOrder = async (req, res) => {
    try {
        const orderData = req.body;
        
        const client = await createShiprocketClient();
        
        const response = await client.post('/orders/create/adhoc', orderData);

        res.json({
            success: true,
            order_id: response.data.order_id,
            shipment_id: response.data.shipment_id,
            data: response.data
        });
    } catch (error) {
        console.error('Create order error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to create order'
        });
    }
};

// 3. Assign AWB to shipment
export const assignAWB = async (req, res) => {
    try {
        const { shipment_id, courier_id } = req.body;

        const client = await createShiprocketClient();
        
        const response = await client.post('/courier/assign/awb', {
            shipment_id,
            courier_id
        });

        res.json({
            success: true,
            awb_code: response.data.response.data.awb_code,
            courier_name: response.data.response.data.courier_name,
            data: response.data
        });
    } catch (error) {
        console.error('Assign AWB error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to assign AWB'
        });
    }
};

// 4. Generate pickup request
export const generatePickup = async (req, res) => {
    try {
        const { shipment_id } = req.body;

        const client = await createShiprocketClient();
        
        const response = await client.post('/courier/generate/pickup', {
            shipment_id
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Generate pickup error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to generate pickup'
        });
    }
};

// 5. Generate manifest
export const generateManifest = async (req, res) => {
    try {
        const { shipment_id } = req.body;

        const client = await createShiprocketClient();
        
        const response = await client.post('/manifests/generate', {
            shipment_id
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Generate manifest error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to generate manifest'
        });
    }
};

// 6. Print manifest
export const printManifest = async (req, res) => {
    try {
        const { order_ids } = req.body;

        const client = await createShiprocketClient();
        
        const response = await client.post('/manifests/print', {
            order_ids
        });

        res.json({
            success: true,
            manifest_url: response.data.manifest_url,
            data: response.data
        });
    } catch (error) {
        console.error('Print manifest error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to print manifest'
        });
    }
};

// 7. Generate shipping label
export const generateLabel = async (req, res) => {
    try {
        const { shipment_id } = req.body;

        const client = await createShiprocketClient();
        
        const response = await client.post('/courier/generate/label', {
            shipment_id
        });

        res.json({
            success: true,
            label_url: response.data.label_url,
            data: response.data
        });
    } catch (error) {
        console.error('Generate label error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to generate label'
        });
    }
};

// 8. Print invoice
export const printInvoice = async (req, res) => {
    try {
        const { order_ids } = req.body;

        const client = await createShiprocketClient();
        
        const response = await client.post('/orders/print/invoice', {
            ids: order_ids
        });

        res.json({
            success: true,
            invoice_url: response.data.invoice_url,
            data: response.data
        });
    } catch (error) {
        console.error('Print invoice error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to print invoice'
        });
    }
};

// 9. Track shipment by AWB
export const trackShipment = async (req, res) => {
    try {
        const { awb_code } = req.params;

        const client = await createShiprocketClient();
        
        const response = await client.get(`/courier/track/awb/${awb_code}`);

        res.json({
            success: true,
            tracking_data: response.data,
            data: response.data
        });
    } catch (error) {
        console.error('Track shipment error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to track shipment'
        });
    }
};

// Complete order flow - creates order and assigns courier automatically
export const createCompleteOrder = async (req) => {
    try {
        const { orderId, orderAmount, items, address, shippingFee } = req.body;
        
        console.log('Creating Shiprocket order for:', orderId);
        console.log('Items:', items.length, 'Address:', address.city, 'Shipping Fee:', shippingFee);
        
        const client = await createShiprocketClient();
        
        // Format order items for Shiprocket
        const orderItems = items.map((item, index) => {
            const quantity = parseInt(item.quantity) || 1;
            const priceWithoutGST = parseFloat(item.price) || 0;
            
            // Calculate GST based on category
            // Apparels: 5% GST (2.5% CGST + 2.5% SGST)
            // Others: 18% GST (9% CGST + 9% SGST)
            const gstRate = item.category === 'Apparels' ? 0.05 : 0.18;
            const gstAmount = priceWithoutGST * gstRate;
            const priceIncludingGST = priceWithoutGST + gstAmount;
            
            // Create unique SKU by combining product ID with size and index
            // This prevents "SKU cannot be repeated" error
            const uniqueSku = item.size && item.size !== 'default' 
                ? `${item._id}-${item.size}` 
                : `${item._id}-${index}`;
            
            // Add size to product name if it exists and is not 'default'
            const productName = item.size && item.size !== 'default'
                ? `${item.name} (${item.size})`
                : item.name || 'Product';
            
            console.log(`Item: ${productName}, Base Price: ${priceWithoutGST}, GST: ${gstAmount}, Price with GST: ${priceIncludingGST}, Qty: ${quantity}`);
            
            return {
                name: productName,
                sku: uniqueSku,
                units: quantity,
                selling_price: parseFloat(priceIncludingGST.toFixed(2)),
                discount: 0,
                tax: 0,
                hsn: item.category === 'Apparels' ? 6109 : 4901 // Common HSN codes
            };
        });
        
        // Calculate total weight and find maximum dimensions from all items
        let totalWeight = 0;
        let maxLength = 0;
        let maxBreadth = 0;
        let totalHeight = 0;
        
        items.forEach(item => {
            const quantity = parseInt(item.quantity) || 1;
            // Weight in kg (product weight is in grams, convert to kg)
            const itemWeight = (item.weight || 400) / 1000;
            totalWeight += itemWeight * quantity;
            
            // Get maximum length and breadth, sum up heights
            maxLength = Math.max(maxLength, item.length || 30);
            maxBreadth = Math.max(maxBreadth, item.breadth || 27);
            totalHeight += (item.height || 2) * quantity;
        });
        
        // Ensure minimum weight of 0.5kg for Shiprocket
        totalWeight = Math.max(totalWeight, 0.5);
        
        // Round dimensions
        maxLength = Math.ceil(maxLength);
        maxBreadth = Math.ceil(maxBreadth);
        totalHeight = Math.ceil(totalHeight);
        
        console.log('Calculated package dimensions:', { 
            weight: totalWeight, 
            length: maxLength, 
            breadth: maxBreadth, 
            height: totalHeight 
        });
        
        // Calculate subtotal (sum of all prices including GST × quantities)
        let calculatedSubtotal = 0;
        orderItems.forEach(item => {
            calculatedSubtotal += item.selling_price * item.units;
        });
        
        // Use shipping fee from frontend (already calculated from serviceability check)
        // Frontend ensures: if actual shipping < 100, use 100; else use actual value
        const shippingCharges = shippingFee ? Math.ceil(parseFloat(shippingFee)) : 100;
        
        console.log('Order amount calculation:', {
            totalOrderAmount: orderAmount,
            calculatedSubtotal: calculatedSubtotal,
            shippingFeeFromFrontend: shippingFee,
            shippingCharges: shippingCharges,
            itemsCount: orderItems.length
        });
        
        // Format address for Shiprocket
        const shiprocketOrderData = {
            order_id: orderId.toString(),
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: "work", // Your Shiprocket pickup location name
            channel_id: "",
            comment: "YourCampusMerch Order",
            billing_customer_name: address.firstName || 'Customer',
            billing_last_name: address.lastName || 'Name',
            billing_address: address.street || 'Address',
            billing_address_2: "",
            billing_city: address.city || 'City',
            billing_pincode: address.zipcode ? address.zipcode.toString() : '110001',
            billing_state: address.state || 'State',
            billing_country: "India",
            billing_email: address.email || "customer@yourcampusmerch.com",
            billing_phone: address.phone ? address.phone.toString() : '9999999999',
            shipping_is_billing: true,
            shipping_customer_name: address.firstName || 'Customer',
            shipping_last_name: address.lastName || 'Name',
            shipping_address: address.street || 'Address',
            shipping_address_2: "",
            shipping_city: address.city || 'City',
            shipping_pincode: address.zipcode ? address.zipcode.toString() : '110001',
            shipping_country: "India",
            shipping_state: address.state || 'State',
            shipping_email: address.email || "customer@yourcampusmerch.com",
            shipping_phone: address.phone ? address.phone.toString() : '9999999999',
            order_items: orderItems,
            payment_method: req.body.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
            shipping_charges: shippingCharges,
            giftwrap_charges: 0,
            transaction_charges: 0,
            total_discount: 0,
            sub_total: parseFloat(calculatedSubtotal.toFixed(2)),
            length: maxLength,
            breadth: maxBreadth,
            height: totalHeight,
            weight: totalWeight
        };
        
        console.log('Shiprocket order data:', JSON.stringify(shiprocketOrderData, null, 2));
        
        // Step 1: Create order in Shiprocket
        const orderResponse = await client.post('/orders/create/adhoc', shiprocketOrderData);
        
        console.log('Shiprocket response:', JSON.stringify(orderResponse.data, null, 2));
        
        // Check if order was created successfully
        if (!orderResponse.data || !orderResponse.data.order_id) {
            console.error('Invalid response from Shiprocket:', orderResponse.data);
            return {
                success: false,
                message: 'Failed to create Shiprocket order - Invalid response',
                error: orderResponse.data
            };
        }
        
        const { order_id, shipment_id } = orderResponse.data;
        
        console.log('Shiprocket order created:', order_id, 'Shipment:', shipment_id);
        
        // Return only order and shipment ID - no AWB assignment or pickup scheduling
        return {
            success: true,
            data: {
                order_id: order_id,
                shipment_id: shipment_id
            }
        };
        
    } catch (error) {
        console.error('Complete order flow error:', {
            message: error.response?.data?.message || error.message,
            status_code: error.response?.status,
            data: error.response?.data,
            stack: error.stack
        });
        return {
            success: false,
            message: error.response?.data?.message || error.message,
            details: error.response?.data
        };
    }
};

// Webhook handler for Shiprocket status updates
export const shiprocketWebhook = async (req, res) => {
    try {
        console.log('Shiprocket webhook received:', JSON.stringify(req.body, null, 2));
        
        const webhookData = req.body;
        
        // Extract order ID and status from webhook
        // Shiprocket sends different formats, handle both
        const orderId = webhookData.order_id || webhookData.order?.order_id;
        const currentStatus = webhookData.current_status || webhookData.status;
        const awbCode = webhookData.awb_code || webhookData.awb;
        
        if (!orderId) {
            console.log('No order ID found in webhook');
            return res.status(200).json({ success: true, message: 'No order ID' });
        }
        
        // Find order in database by shiprocket_order_id
        const order = await orderModel.findOne({ shiprocket_order_id: orderId });
        
        if (!order) {
            console.log(`Order not found for Shiprocket order ID: ${orderId}`);
            return res.status(200).json({ success: true, message: 'Order not found' });
        }
        
        // Map Shiprocket status to our order status
        let orderStatus = order.status; // Keep current status by default
        
        // Common Shiprocket statuses:
        // - PICKUP_SCHEDULED, PICKUP_GENERATED, MANIFESTED, PICKED_UP
        // - IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED
        // - RTO_INITIATED, RTO_DELIVERED, CANCELLED
        
        const statusLower = currentStatus?.toLowerCase() || '';
        
        if (statusLower.includes('picked') || statusLower.includes('pickup_complete') || statusLower.includes('manifested')) {
            orderStatus = 'Shipped';
        } else if (statusLower.includes('in_transit') || statusLower.includes('in transit') || statusLower.includes('out_for_delivery')) {
            orderStatus = 'Shipped';
        } else if (statusLower.includes('delivered')) {
            orderStatus = 'Delivered';
        } else if (statusLower.includes('cancelled') || statusLower.includes('rto')) {
            orderStatus = 'Cancelled';
        }
        
        // Update order status and AWB if changed
        const updateData = { status: orderStatus };
        if (awbCode && !order.awb_code) {
            updateData.awb_code = awbCode;
        }
        
        await orderModel.findByIdAndUpdate(order._id, updateData);
        
        console.log(`Order ${order._id} status updated to: ${orderStatus} (Shiprocket: ${currentStatus})`);
        
        // Send success response to Shiprocket
        res.status(200).json({ 
            success: true, 
            message: 'Webhook processed successfully',
            orderId: order._id,
            newStatus: orderStatus
        });
        
    } catch (error) {
        console.error('Shiprocket webhook error:', error);
        // Always return 200 to prevent Shiprocket from retrying
        res.status(200).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export default {
    checkServiceability,
    createShiprocketOrder,
    assignAWB,
    generatePickup,
    generateManifest,
    printManifest,
    generateLabel,
    printInvoice,
    trackShipment,
    createCompleteOrder,
    shiprocketWebhook
};
