import express from "express"
import dotenv from "dotenv"
import connectDb from "./lib/db.js"
import User from "./model/user.model.js"
import Redis from "ioredis"
import { rateLimit } from "./middleware/rateLimit.js"
import { sendMail } from "./lib/sendMail.js"
import { emailQueue } from "./queue.js"

dotenv.config()

const PORT = process.env.PORT 

const app =  express()
export const redis = new Redis(process.env.REDIS_URL)

app.use(express.json())

app.get("/",(req,res)=>{
    return res.status(200).json({
        message:"hello from redis"
    })
})

app.post("/create",async (req,res) => {
    const {name,email,password} = req.body
    redis.del("users:all")
    const user = await User.create({
        name,
        email,
        password
    })

    // await sendMail()  causing the wait to user

    await emailQueue.add("send-email",{email})

    return res.json({
        user
    })
})

//45ms
app.get("/users", rateLimit, async (req,res) => {
    const users = await User.find({})
    return res.json({
        users
    })
})

app.get("/redis-get-users", async(req,res) => {
    //get
    const cachedUsers = await redis.get("users:all")
    if(cachedUsers){
        const users = JSON.parse(cachedUsers)
        return res.json(users)
    }

    //if not get , set here ||->*<-||
    const users = await User.find({});
    redis.set("users:all",JSON.stringify(users))

    return res.json(users)
})

app.post("/send-otp", async(req,res)=>{
    const {email} = req.body

    const otp = Math.floor(Math.random()*19000).toString()
    await redis.set(`otp:${email}`,otp, "EX", 30)

    return res.json({otp});
})

app.post("/verify-otp", async(req,res)=>{
    const{email,otp} = req.body;

    const cachedOtp = await redis.get(`otp:${email}`)
    if(!cachedOtp){
        return res.status(400).json({
            msg:"otp has been expired"
        })
    }

    if(cachedOtp != otp){
        return res.status(400).json({ "message": "incorrect otp" })
    }

    await redis.del(`otp:${email}`)
    return res.json({
        message:"otp successfully verified!"
    })
})




app.listen(PORT, async ()=>{
    await connectDb()
    console.log("server is running");
})
