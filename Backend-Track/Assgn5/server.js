const client = require("./db.js");
const express = require("express");
const app=express();
const PORT=process.env.PORT || 3000;
app.use(express.json());
app.post("/auth/signup",async (req,res)=>{
    if(!req.body.email || !req.body.password){
        res.status(400);
        res.json({"error":"The Server never trusts the client"});
    }
    console.log(req.body.email);
    const{data,error}=await client.auth.signUp({
        email:req.body.email,
        password:req.body.password
    })
    if(error){
        res.status(400);
        res.json({"error":error.message});
    }
    else{
        res.status(200);
        res.json({"message":"Created"});
    }
});
app.post("/auth/login",async (req,res)=>{
    if(!req.body.email || !req.body.password){
        res.status(400);
        res.json({"error":"The Server never trusts the client"});
    }
    const{data,error}=await client.auth.signInWithPassword({
        email:req.body.email,
        password:req.body.password
    })
    if(error){
        res.status(401);
        res.json({"error":"Invalid Login Credentials"});
    }else{
        res.status(200);
        res.json({"token":data.session.access_token,"refresh_token":data.session.refresh_token});
    }
})
app.listen(PORT, () => {
  console.log(`Server running and connected to supabase`);
});