const express=require("express");
const app=express();
const PORT=4000;
app.get("/",(req,res)=>{
    res.status(200);
    res.json({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] });
});
app.get("/health",(req,res)=>{
    res.status(200);
    res.json({ "status": "OK" });
})

app.listen(PORT,err=>{
    console.log(`server is running on port ${PORT}`);
    if(err){
        console.log(err);
    }
})