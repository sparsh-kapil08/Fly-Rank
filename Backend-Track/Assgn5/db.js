const {createClient}=require("@supabase/supabase-js");
const dotenv=require("dotenv");
dotenv.config();
const url=process.env.SUPABASE_URL;
const key=process.env.SUPABASE_KEY;
const client=createClient(url,key);

module.exports=client;