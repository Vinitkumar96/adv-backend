import express from "express"
import dotenv from "dotenv"
dotenv.config()

const port = process.env.port

const app = express()
app.use(express.json())

app.get("/",(req,res) => {
    return res.status(200).json({
        message:"Hello from order services"
    })
})

app.listen(port , () => {
    console.log("order service listening");
})