import express from 'express';
import cors from 'cors';
import 'dotenv/config';


// app initialization

const app=express();
const port=process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());    


// api  endpoints


app.get('/',(req,res)=>{
    res.send('Gift4Corp Backend is running');
});

app.listen(port,()=>console.log(`Server is running on port ${port}`));