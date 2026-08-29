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
app.get("/public/info",async (req,res)=>{
    res.status(200);
    res.json({ "message": "Welcome stranger! This info is public."})
})
const protected=async (req,res,next)=>{
    try{
        const {data,error}=await client.auth.getSession();

        if(error || !data.session.access_token){
            console.log(data);
            res.status(401);
            res.json({ "error": "Access token required" } );
    }
          
    req.user=data.session.user;
    next();
    }catch(err){
        res.status(500);
        res.json({"error":"Internal Server Error"});    
}};
app.get("/protected/profile", protected, async(req,res)=>{
    res.status(200);
    res.json({"email":req.user.email,"id":req.user.id,"date":req.user.created_at})
})
app.post("/auth/logout",protected,async(req,res)=>{
    const {data,error}=await client.auth.signOut();
    if(error){
        res.status(500);
        res.json({"error":"Internal Server Error"});
    }else{
        res.status(204);
        res.json({"message":"Logged Out"});
    }
})
app.get("/protected/dashboard",protected,async(req,res)=>{
    if(req.user.email){
        res.status(200);
        res.json({"message":"Welcome to the dashboard"});
    }else{
        res.status(401);
        res.json({"error":"Unauthorized"});
    }
})
app.listen(PORT, () => {
  console.log(`Server running and connected to supabase`);
});