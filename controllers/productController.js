

// function for add product

const addProduct = async (req, res) => {
    // try {
    //     const { name, description, price, image, category, subCategory, sizes, bestseller, colour } = req.body;
    //     const newProduct = new ProductModel({
    //         name,
    //         description,                    
    //         price,
    //         image,
    //         category,
    //         subCategory,
    //         sizes,
    //         bestseller,
    //         colour
    //     });
    //     const savedProduct = await newProduct.save();
    //     res.status(201).json(savedProduct);
    // } catch (error) {
    //     res.status(400).json({ error: error.message });
    // }
};

// function for get all products

const listProducts = async (req, res) => {
   

}

// function for removing products


const removeProduct = async (req, res) => {
   

}

// function for single product info

const singleProduct=async(req,res)=>{



}



export { addProduct, listProducts, removeProduct,singleProduct };