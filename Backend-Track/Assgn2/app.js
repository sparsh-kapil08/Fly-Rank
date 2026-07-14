const express=require("express");
const app=express();
const PORT=4000;
app.get("/",(req,res)=>{
    res.status(200);
    res.send("THE MAIN PAGE");

});

app.listen(PORT,err=>{
    console.log(`server is running on port ${PORT}`);
    if(err){
        console.log(err);
    }
})