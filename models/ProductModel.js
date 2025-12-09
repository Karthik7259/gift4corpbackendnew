import mongoose from "mongoose";


const productSchema = new mongoose.Schema(
    {
      name:{
        type:String,
        required:true,
      },
        description:{   
        type:String,
        required:true,
      },
      price:{
        type:Number,
        required:true,
      },
      Mrpprice:{
        type:Number,
        required:true,
      },
      image:{   
        type:Array,
        required:true,
      },
       category:{
        type:String,
        required:true,
      },
      subCategory:{   
        type:String,
        required:true,
      },
      sizes:{   
        type:Array,
        required:true,
      },
      quantity:{
        type:Number,
        default:0,
      },
      color:{
        type:String,
      },
      bestseller:{   
        type:Boolean,
      },
      collegeMerchandise:{   
        type:String,
        required:true,
      },
      date:{
        type:Number,
        default:Date.now
      }
      
    })


const ProductModel = mongoose.models.product || mongoose.model("products",productSchema)
    
    
export default ProductModel;