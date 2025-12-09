import {v2 as cloudinary} from 'cloudinary';
import productModel from '../models/ProductModel.js';
// function for add product

// const addProduct = async (req, res) => {
//    try{
//           const {name,description,price,Mrpprice,category,subCategory,sizes,bestseller,collegeMerchandise} =req.body;

//           const image1=req.files.image1 && req.files.image1[0] ;
//           const image2=req.files.image2 && req.files.image2[0] ;
//           const image3=req.files.image3 && req.files.image3[0] ;
//           const image4=req.files.image4 && req.files.image4[0] ;

//           console.log("collegeMerchandise:", collegeMerchandise);

//           const images=[image1,image2,image3,image4].filter((item)=> item !== undefined);
 

//            let imagesUrl=await Promise.all(
//             images.map(async (item)=>{
//                 let result=await cloudinary.uploader.upload(item.path,{resource_type:"image"});

//                 return result.secure_url;
//             })
//            )


//           const productData = {
//             name,
//             description,
//             category,
//             subCategory,
//             sizes,
//             bestseller:bestseller === 'true' ? true : false,
//             collegeMerchandise,
//             price:Number(price),
//             Mrpprice:Number(Mrpprice),
//             sizes : JSON.parse(sizes.replace(/'/g, '"')),
//             image:imagesUrl,
//             date:Date.now(),
//           }



//           const newProduct = new productModel(productData);

//           await newProduct.save();
          

//  res.json({success:true,message:"Product added successfully"})

//    }   catch(err){  
//              console.log(err);
//            res.status(500).json({error:"Internal server error"})
//     }

// };


const addProduct = async (req, res) => {
  try {
    const { name, description, price, Mrpprice, category, subCategory, sizes, bestseller, collegeMerchandise, quantity, color } = req.body;

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(i => i);

    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, { resource_type: "image" });
        return result.secure_url;
      })
    );

    const productData = {
      name,
      description,
      category,
      subCategory,
      bestseller: bestseller === "true",
      collegeMerchandise,
      price: Number(price),
      Mrpprice: Number(Mrpprice),
      quantity: quantity ? Number(quantity) : 0,
      color: color || '',
      image: imagesUrl,
      date: Date.now(),
    };

    // Add sizes only when product has size
    if (sizes) {
      productData.sizes = JSON.parse(sizes.replace(/'/g, '"'));
    }

    const newProduct = new productModel(productData);
    await newProduct.save();

    res.json({ success: true, message: "Product added successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
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
  try{
    const {productId} = req.body;
    const product = await productModel.findById(productId);
    
    if(!product){
      return res.status(404).json({success:false, message:"Product not found"});
    }
    
    res.json({success:true, product});
  }catch(err){
    console.log(err);
    res.status(500).json({success:false, error:"Internal server error"});
  }
}

// function for updating product

const updateProduct = async (req, res) => {
  try {
    const { id, name, description, price, Mrpprice, category, subCategory, sizes, bestseller, collegeMerchandise, quantity, color } = req.body;

    // Find existing product
    const existingProduct = await productModel.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Handle image uploads if new images are provided
    let imagesUrl = existingProduct.image; // Keep existing images by default

    if (req.files && Object.keys(req.files).length > 0) {
      const image1 = req.files.image1 && req.files.image1[0];
      const image2 = req.files.image2 && req.files.image2[0];
      const image3 = req.files.image3 && req.files.image3[0];
      const image4 = req.files.image4 && req.files.image4[0];

      const images = [image1, image2, image3, image4].filter(i => i);

      if (images.length > 0) {
        imagesUrl = await Promise.all(
          images.map(async (item) => {
            let result = await cloudinary.uploader.upload(item.path, { resource_type: "image" });
            return result.secure_url;
          })
        );
      }
    }

    // Prepare update data
    const updateData = {
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      category: category || existingProduct.category,
      subCategory: subCategory || existingProduct.subCategory,
      bestseller: bestseller !== undefined ? bestseller === "true" : existingProduct.bestseller,
      collegeMerchandise: collegeMerchandise || existingProduct.collegeMerchandise,
      price: price ? Number(price) : existingProduct.price,
      Mrpprice: Mrpprice ? Number(Mrpprice) : existingProduct.Mrpprice,
      quantity: quantity !== undefined ? Number(quantity) : existingProduct.quantity,
      color: color || existingProduct.color,
      image: imagesUrl,
    };

    // Add sizes only when product has size
    if (sizes) {
      updateData.sizes = typeof sizes === 'string' ? JSON.parse(sizes.replace(/'/g, '"')) : sizes;
    }

    // Update product
    const updatedProduct = await productModel.findByIdAndUpdate(id, updateData, { new: true });

    res.json({ success: true, message: "Product updated successfully", product: updatedProduct });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};



export { addProduct, listProducts, removeProduct,singleProduct, updateProduct };