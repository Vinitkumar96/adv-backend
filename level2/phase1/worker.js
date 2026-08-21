import { Worker } from "bullmq";
import Redis from "ioredis";
import { sendMail } from "./lib/sendMail.js";

const connection = new Redis("redis://localhost:6379", {
    maxRetriesPerRequest: null
})

const worker = new Worker("emailQueue", async (job) => {
    console.log("worker started");
    const email = job.data.email
    await sendMail(email)
    console.log("worker ended");
},{connection})