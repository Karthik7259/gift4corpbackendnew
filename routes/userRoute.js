import express from 'express';

import { loginUser, registerUser, adminLogin, forgotPassword, verifyOTP, resetPassword } from '../controllers/userController.js';

const Userrouter = express.Router();    


// User login route
Userrouter.post('/login', loginUser);
// User registration route
Userrouter.post('/register', registerUser);
// Admin login route
Userrouter.post('/admin', adminLogin);
// Forgot password route - Send OTP
Userrouter.post('/forgot-password', forgotPassword);
// Verify OTP route
Userrouter.post('/verify-otp', verifyOTP);
// Reset password route - After OTP verification
Userrouter.post('/reset-password', resetPassword);


export default Userrouter;