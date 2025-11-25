import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

 const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
}


// route for user login
const loginUser =async (req, res) => {
    // Logic for logging in a user


    try{
        const {email,password}=req.body;
 
        const user=await userModel.findOne({email:email});

        if(!user){
            return res.status(200).json({success:false,message:"User does not exist"});
        }

        const isMatch=await bcrypt.compare(password,user.password);

        if(!isMatch){
            return res.status(200).json({success:false,message:"Incorrect password"});
        }

        const token=createToken(user._id);

        res.json({success:true,token:token});


    }catch(error){
        console.log("Error in user login:",error);
        res.json({success:false,message:error.message})
    }
     
}

// route for user registration
const registerUser = async (req, res) => {
    // Logic for registering a user

   try{
          const {name,email,password}=req.body;

          const exists=await userModel.findOne({email:email});

            if(exists){
                return res.status(200).json({success:false,message:"User already exists"});
            }


            if (!validator.isEmail(email)) {
                return res.status(200).json({success:false,message:"Invalid email"});
            }

            if (password.length<8) {
                return res.status(200).json({success:false,message:"Password is not strong enough"});
            }
            // hahing user password
             const salt=await bcrypt.genSalt(10);
             const hashedPassword=await bcrypt.hash(password,salt);


             const newUser=new userModel({
                name:name,
                email:email,
                password:hashedPassword,
             });


             const user=await newUser.save();

        

             const token=createToken(user._id);

             res.json({success:true,token:token});

            }

          
   
   catch(error){    
    console.log("Error in user registration:",error);
    res.json({success:false,message:error.message})
   }
}

// Route for adminLogin
const adminLogin = async (req, res) => {
    // Logic for admin login
}   

export { loginUser, registerUser ,adminLogin};