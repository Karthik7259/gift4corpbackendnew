import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import Userrouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import OrderRouter from './routes/orderRoute.js';
import collegeMerchandiseRouter from './routes/collegeMerchandiseRoute.js';
import shiprocketRouter from './routes/shiprocketRoute.js';
import categoryRouter from './routes/categoryRoute.js';

import contactRouter from './routes/contactRoute.js';

// app initialization

const app=express();
const port=process.env.PORT || 5000;
connectDB();
connectCloudinary();

// middlewares
app.use(cors({
    origin: [
        'http://localhost:5174',
        'https://yourcampusmerch.com',
        'https://gift4corp-admin.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));    


// Use user routes
app.use('/api/user', Userrouter);
app.use('/api/product',productRouter);
app.use('/api/cart',cartRouter);
app.use('/api/order',OrderRouter);
app.use('/api/college-merchandise',collegeMerchandiseRouter);
app.use('/api/shipping',shiprocketRouter); // Changed from /api/shiprocket to avoid blocking
app.use('/api/category',categoryRouter);

// Contact form route
app.use('/api/contact', contactRouter);

// api  endpoints


app.get('/',(req,res)=>{
    res.send('YourCampusMerch Backend is running');
});

app.listen(port,()=>console.log(`Server is running on port ${port}`));