

// add product to user cart

import userModel from "../models/userModel.js";
import productModel from "../models/ProductModel.js";

const addToCart = async (req, res) => {
    try{
      const {userId,itemId,size}=req.body;
      
      // Check product availability
      const product = await productModel.findById(itemId);
      if(!product){
        return res.status(404).json({success:false,message:"Product not found"});
      }
      
      if(product.quantity === 0){
        return res.status(400).json({success:false,message:"Product is out of stock"});
      }
      
      const userData=await userModel.findById(userId);
      let cartData=await userData.cartData
      
      // Calculate current quantity for this item
      let currentQuantity = 0;
      if(cartData[itemId] && cartData[itemId][size]){
        currentQuantity = cartData[itemId][size];
      }
      
      // Check if adding one more would exceed stock
      if(currentQuantity >= product.quantity){
        return res.status(400).json({success:false,message:`Only ${product.quantity} items available in stock`});
      }

      if(cartData[itemId]){
       if(cartData[itemId][size]){
          cartData[itemId][size] +=1;
       } else{
          cartData[itemId][size]=1;
       }
      } else{
        cartData[itemId]={};
                  cartData[itemId][size]=1;
      }


      await userModel.findByIdAndUpdate(userId,{cartData});
      res.json({success:true,message:"Added to Cart"});

    }catch(err){
        console.log(err);
        res.status(500).json({success:false,message:err.message})
    }

};


//  update product in user cart

const updateCart = async (req, res) => {
    try{

        const {userId,itemId,size,quantity}=req.body;
        
        // Check product availability
        const product = await productModel.findById(itemId);
        if(!product){
          return res.status(404).json({success:false,message:"Product not found"});
        }
        
        // Validate quantity against available stock
        if(quantity > product.quantity){
          return res.status(400).json({success:false,message:`Only ${product.quantity} items available in stock`});
        }
        
        const userData=await userModel.findById(userId);
        let cartData=userData.cartData;

        if(!cartData[itemId]){
            cartData[itemId]={};
        }

        cartData[itemId][size]=quantity;    


        await userModel.findByIdAndUpdate(userId,{cartData});
      res.json({success:true,message:" Cart Updated"});

        
    }catch(err){
        console.log(err);
        res.status(500).json({success:false,message:err.message})
    }

};


// get user cart 

const getUserCart = async (req, res) => {
    try{

        const {userId}=req.body;
        const userData=await userModel.findById(userId);
        let cartData=await userData.cartData;
        res.json({success:true,cartData});
        
        
    }catch(err){
       console.log(err);
        res.status(500).json({success:false,message:err.message})   
    }

};


export {addToCart,updateCart,getUserCart};