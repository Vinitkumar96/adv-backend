import { redis } from "../index.js";

export const  rateLimit = async(req,res,next) => {
    const ip = req.ip;
    const key = `ip:${ip}`
    const count = await redis.incr(key)
    if(count == 1){
        redis.expire(key,30)
    }
    if(count > 5){
        return res.json({
            message:"Too many request"
        })
    }

    next() 
}