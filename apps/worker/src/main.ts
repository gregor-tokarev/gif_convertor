import path from "path";
import fs from "fs";
import { Job, Worker } from "bullmq";
import * as Minio from "minio";
import { generateGif } from "./generateGif";
import { ConvertJob, MAIN_BUCKET_NAME, QUEUE_CONVERT } from "contracts";
import { config } from "dotenv";

config({ path: ".local.env" });

const CONVERT_DIR = "uploads";

// Ensure the uploads directory exists
if (!fs.existsSync(CONVERT_DIR)) {
    fs.mkdirSync(CONVERT_DIR);
}

const minio = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "",
    port: Number(process.env.MINIO_PORT),
    secretKey: process.env.MINIO_SECRET_KEY ?? "",
    useSSL: process.env.MINIO_USE_SSL === "true",
});

const worker = new Worker<ConvertJob>(
    QUEUE_CONVERT,
    async (job: Job) => {
        const inputFilePath = job.data.filePath;
        if (!inputFilePath) {
            return;
        }

        const tempFilePath = path.join(CONVERT_DIR, `${Date.now()}-${path.basename(inputFilePath)}`);
        await minio.fGetObject(MAIN_BUCKET_NAME, inputFilePath, tempFilePath);

        const outputFileName = `${Date.now()}-${path.basename(inputFilePath)}-output.gif`;
        const outputFilePath = path.join(CONVERT_DIR, outputFileName);

        const gifTempPath = await generateGif(tempFilePath, outputFilePath);

        await minio.fPutObject(MAIN_BUCKET_NAME, outputFileName, gifTempPath, { "Content-Type": "image/gif" });
        await Promise.all([job.updateProgress(100), job.updateData({ ...job.data, gifPath: outputFileName })]);
    },
    {
        autorun: false,
        connection: {
            host: process.env.REDIS_HOST ?? "",
            port: Number(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
        },
        removeOnComplete: { age: 1000 },
    },
);

worker.run().then(() => console.log("Worker started"));
