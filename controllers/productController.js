import {v2 as cloudinary} from 'cloudinary';
import productModel from '../models/ProductModel.js';
// function for add product

const addProduct = async (req, res) => {
   try{
          const {name,description,price,Mrpprice,category,subCategory,sizes,bestseller,collegeMerchandise} =req.body;

          const image1=req.files.image1 && req.files.image1[0] ;
          const image2=req.files.image2 && req.files.image2[0] ;
          const image3=req.files.image3 && req.files.image3[0] ;
          const image4=req.files.image4 && req.files.image4[0] ;

          console.log("collegeMerchandise:", collegeMerchandise);

          const images=[image1,image2,image3,image4].filter((item)=> item !== undefined);
 

           let imagesUrl=await Promise.all(
            images.map(async (item)=>{
                let result=await cloudinary.uploader.upload(item.path,{resource_type:"image"});

                return result.secure_url;
            })
           )


          const productData = {
            name,
            description,
            category,
            subCategory,
            sizes,
            bestseller:bestseller === 'true' ? true : false,
            collegeMerchandise,
            price:Number(price),
            Mrpprice:Number(Mrpprice),
            sizes : JSON.parse(sizes.replace(/'/g, '"')),
            image:imagesUrl,
            date:Date.now(),
          }



          const newProduct = new productModel(productData);

          await newProduct.save();
          

 res.json({success:true,message:"Product added successfully"})

   }   catch(err){  
             console.log(err);
           res.status(500).json({error:"Internal server error"})
    }

};

// function for get all products

const listProducts = async (req, res) => {
    try{
      const products=await productModel.find({});
      res.json({success:true,products});

    }catch(err){
      console.log(err);
      res.status(500).json({error:"Internal server error"})
    }

}

// function for removing products


const removeProduct = async (req, res) => {
    try{
         const products=await productModel.findByIdAndDelete(req.body.id);
         console.log(products);
         res.json({success:true,message:"Product removed successfully"});
    }catch(err){  
        console.log(err); 

      res.status(500).json({error:"Internal server error"}) 
    }


}

// function for single product info

const singleProduct=async(req,res)=>{



}



export { addProduct, listProducts, removeProduct,singleProduct };