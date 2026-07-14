const express=require("express");
const app=express();
const PORT=3000;
app.use(express.json());
let tasks=[{
    id:1,
    title:"Task 1",
    done:true
},{
    id:2,
    title:"Task 2",
    done:false
},{
    id:3,
    title:"Task 3",
    done:false
}];
app.get("/",(req,res)=>{
    res.status(200);
    res.json({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] });
});
app.get("/health",(req,res)=>{
    res.status(200);
    res.json({ "status": "OK" });
})
app.get("/tasks",(req,res)=>{
    res.status(200);
    res.send(tasks);
});
app.get("/tasks/:id",(req,res)=>{
    id=req.params.id;
    let task=tasks.find(e=>e.id==id);
    task?res.status(200).send(task):res.status(404).json({ "error": `Task ${id} not found` });
});
app.post("/tasks",(req,res)=>{
    const task=req.body;
    console.log(task);
    if(!task.title){
        res.status(400);
        res.json({"error":"title is empty"});
    };
    const count=tasks.length;
    task.id=count+1;
    task.done=false;
    tasks.push(task);
    res.status(201);
    res.json(task);
});
app.listen(PORT,err=>{
    console.log(`server is running on port ${PORT}`);
    if(err){
        console.log(err);
    }
})