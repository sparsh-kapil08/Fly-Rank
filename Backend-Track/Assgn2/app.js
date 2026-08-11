const express=require("express");
const swaggerUi=require("swagger-ui-express");
const swaggerDocument=require("./openapi.json");
const app=express();
const database=require("better-sqlite3");
const db=new database("tasks.db");
const PORT=3000;
let count=0;
let tasks=[];
app.use(express.json());
app.use("/docs",swaggerUi.serve,swaggerUi.setup(swaggerDocument));
db.exec("CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY,title VARCHAR(225),done BOOLEAN)");
count=db.prepare('SELECT COUNT(*) AS TOTAL FROM TASKS').get().TOTAL;
if(count==0){
    db.exec("INSERT INTO tasks(id,title,done) VALUES(1,'Task 1',true),(2,'Task 2',false),(3,'Task 3',false) ");
    count=3;
}
app.get("/",(req,res)=>{
    res.status(200);
    res.json({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] });
});
app.get("/health",(req,res)=>{
    res.status(200);
    res.json({ "status": "OK" });
})
app.get("/tasks",(req,res)=>{
    tasks=db.prepare('SELECT * FROM TASKS').all();
    res.status(200);
    res.send(tasks);
});
app.get("/tasks/:id",(req,res)=>{
    id=req.params.id;
    tasks=db.prepare("SELECT * FROM TASKS WHERE ID=?").all(id);

    tasks.length>0?res.status(200).send(tasks):res.status(404).json({ "error": `Task ${id} not found` });
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
app.put("/tasks/:id",(req,res)=>{
    const id=req.params.id;
    const index=tasks.findIndex(e=>e.id==id);
    if(index==-1){
        res.status(404);
        res.json({ "error": `Task ${id} not found` });
    }
    if(!req.body.title && !req.body.done){
        res.status(400);
        res.json({"error":"title and done are empty"});
    }
    if(req.body.title){
        tasks[index].title=req.body.title;
    }
    if(req.body.done){
        tasks[index].done=req.body.done;
    }
    res.status(200);
    res.send(tasks[index]);
});
app.delete("/tasks/:id",(req,res)=>{
    const id=req.params.id;
    const index=tasks.findIndex(e=>e.id==id);
    if(index==-1){
        res.status(404);
        res.json({ "error": `Task ${id} not found` });
    }
    tasks.splice(index,1);
    res.status(200);
    res.json({});
})
app.listen(PORT,err=>{
    console.log(`server is running on port ${PORT}`);
    if(err){
        console.log(err);
    }
})