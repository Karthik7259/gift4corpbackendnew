import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import crypto from "crypto";
import sendEmail from "../service/sendEmail.js";

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


 try
 {

    const {email,password}=req.body;
    if(email!==process.env.admin_email || password!==process.env.admin_password){
        return  res.status(200).json({success:false,message:"Invalid admin credentials"});
    }

    const token=createToken(email); 
    res.json({success:true,token:token});

 }catch(error){
    console.log("Error in admin login:",error);
    res.json({success:false,message:error.message})
 }




}   

// Route for forgot password - Send OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(200).json({ success: false, message: "User not found" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hash OTP and save to database
        user.resetPasswordOTP = crypto.createHash('sha256').update(otp).digest('hex');
        
        // Set OTP expire time (10 minutes)
        user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000;

        await user.save();

        // Email message with OTP
        const message = `
            <h1>Password Reset OTP</h1>
            <p>You requested a password reset. Please use the following OTP to verify your identity:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                ${otp}
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                sendTo: user.email,
                subject: 'Password Reset OTP',
                html: message
            });

            res.status(200).json({ success: true, message: 'OTP sent to your email' });
        } catch (error) {
            user.resetPasswordOTP = undefined;
            user.resetPasswordOTPExpires = undefined;
            await user.save();

            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }

    } catch (error) {
        console.log("Error in forgot password:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Route for verifying OTP
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        // Hash the OTP from request
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        // Find user by email and OTP
        const user = await userModel.findOne({
            email,
            resetPasswordOTP: hashedOTP,
            resetPasswordOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        res.status(200).json({ success: true, message: 'OTP verified successfully' });

    } catch (error) {
        console.log("Error in verify OTP:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Route for reset password after OTP verification
const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({ success: false, message: 'Email, OTP and password are required' });
        }

        // Validate password
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }

        // Hash the OTP from request
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        // Find user by email and OTP
        const user = await userModel.findOne({
            email,
            resetPasswordOTP: hashedOTP,
            resetPasswordOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear OTP fields
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;

        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });

    } catch (error) {
        console.log("Error in reset password:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { loginUser, registerUser ,adminLogin, forgotPassword, verifyOTP, resetPassword };