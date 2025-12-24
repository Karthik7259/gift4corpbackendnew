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
    const { name, description, price, Mrpprice, category, subCategory, sizes, bestseller, collegeMerchandise, quantity, color, weight, length, breadth, height, brand, useSizeVariants, sizeVariants } = req.body;

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
      brand: brand || '',
      image: imagesUrl,
      date: Date.now(),
    };
    
    // Add weight and dimensions if provided
    if(weight) productData.weight = Number(weight);
    if(length) productData.length = Number(length);
    if(breadth) productData.breadth = Number(breadth);
    if(height) productData.height = Number(height);

    // Add sizes only when product has size
    if (sizes) {
      productData.sizes = JSON.parse(sizes.replace(/'/g, '"'));
    }

    // Add size variants if using different pricing for sizes
    if (useSizeVariants === 'true' && sizeVariants) {
      const parsedVariants = JSON.parse(sizeVariants);
      productData.sizeVariants = parsedVariants.map(v => ({
        size: v.size,
        price: Number(v.price),
        mrpPrice: Number(v.mrpPrice),
        quantity: Number(v.quantity)
      }));
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
    const { id, name, description, price, Mrpprice, category, subCategory, sizes, bestseller, collegeMerchandise, quantity, color, brand, useSizeVariants, sizeVariants, deletedImages } = req.body;

    // Find existing product
    const existingProduct = await productModel.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Handle image uploads if new images are provided
    let imagesUrl = [...existingProduct.image]; // Copy existing images

    // Handle deletedImages (indices)
    let deletedIndices = [];
    if (deletedImages) {
      try {
        deletedIndices = JSON.parse(deletedImages);
      } catch (e) {
        deletedIndices = Array.isArray(deletedImages) ? deletedImages : [];
      }
    }
    // Remove images at specified indices
    if (deletedIndices.length > 0) {
      // Sort descending to avoid index shift
      deletedIndices.sort((a, b) => b - a);
      for (const idx of deletedIndices) {
        if (imagesUrl[idx] !== undefined) {
          imagesUrl.splice(idx, 1);
        }
      }
    }

    // Handle new image uploads (replace at index)
    if (req.files && Object.keys(req.files).length > 0) {
      for (let i = 1; i <= 4; i++) {
        const imageFile = req.files[`image${i}`] && req.files[`image${i}`][0];
        if (imageFile) {
          let result = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
          // Replace image at index (i-1), or add if not present
          imagesUrl[i - 1] = result.secure_url;
        }
      }
      // Remove any undefined holes if images were deleted and not replaced
      imagesUrl = imagesUrl.filter(Boolean);
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
      brand: brand || existingProduct.brand,
      image: imagesUrl,
    };

    // Add sizes only when product has size
    if (sizes) {
      updateData.sizes = typeof sizes === 'string' ? JSON.parse(sizes.replace(/'/g, '"')) : sizes;
    }

    // Handle size variants
    if (useSizeVariants === 'true' && sizeVariants) {
      const parsedVariants = typeof sizeVariants === 'string' ? JSON.parse(sizeVariants) : sizeVariants;
      updateData.sizeVariants = parsedVariants.map(v => ({
        size: v.size,
        price: Number(v.price),
        mrpPrice: Number(v.mrpPrice),
        quantity: Number(v.quantity)
      }));
    } else if (useSizeVariants === 'false') {
      // Clear size variants if disabled
      updateData.sizeVariants = [];
    }

    // Update product
    const updatedProduct = await productModel.findByIdAndUpdate(id, updateData, { new: true });

    res.json({ success: true, message: "Product updated successfully", product: updatedProduct });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};


// Fix negative stock quantities
const fixNegativeStock = async (req, res) => {
  try {
    const productsWithNegativeStock = await productModel.find({ quantity: { $lt: 0 } });
    
    if (productsWithNegativeStock.length === 0) {
      return res.json({ success: true, message: "No products with negative stock found" });
    }
    
    const updates = [];
    for (const product of productsWithNegativeStock) {
      await productModel.findByIdAndUpdate(product._id, { quantity: 0 });
      updates.push({ name: product.name, oldQuantity: product.quantity, newQuantity: 0 });
    }
    
    res.json({ 
      success: true, 
      message: `Fixed ${updates.length} products with negative stock`,
      updates: updates
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};



export { addProduct, listProducts, removeProduct,singleProduct, updateProduct, fixNegativeStock };