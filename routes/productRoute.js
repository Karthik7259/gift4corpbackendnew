import express from 'express';


import  {addProduct, listProducts, removeProduct,singleProduct, updateProduct, fixNegativeStock} from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';




const productRouter=express.Router();


const productImageFields = [
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
  { name: 'image5', maxCount: 1 },
  { name: 'image6', maxCount: 1 },
];

productRouter.post('/add', adminAuth, upload.fields(productImageFields), addProduct);
productRouter.put('/update', adminAuth, upload.fields(productImageFields), updateProduct);
productRouter.delete('/remove',adminAuth,removeProduct)   
productRouter.post('/single',singleProduct);
productRouter.get('/list',listProducts);
productRouter.post('/fix-negative-stock',adminAuth,fixNegativeStock);

export default productRouter;


