import express from 'express';

import { loginUser, registerUser, adminLogin } from '../controllers/userController.js';

const Userrouter = express.Router();    


// User login route
Userrouter.post('/login', loginUser);
// User registration route
Userrouter.post('/register', registerUser);
// Admin login route
Userrouter.post('/admin', adminLogin);


export default Userrouter;