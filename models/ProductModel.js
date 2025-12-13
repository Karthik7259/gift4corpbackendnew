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
      sizeVariants:{
        type: Array,
        default: [],
        // Each element: { size: String, price: Number, mrpPrice: Number, quantity: Number }
      },
      quantity:{
        type:Number,
        default:0,
      },
      color:{
        type:String,
      },
      brand:{
        type:String,
      },
      bestseller:{   
        type:Boolean,
      },
      collegeMerchandise:{   
        type:String,
        required:true,
      },
      weight:{
        type:Number,
        default:400,
      },
      length:{
        type:Number,
        default:30,
      },
      breadth:{
        type:Number,
        default:27,
      },
      height:{
        type:Number,
        default:2,
      },
      date:{
        type:Number,
        default:Date.now
      }
      
    })


const ProductModel = mongoose.models.product || mongoose.model("products",productSchema)
    
    
export default ProductModel;