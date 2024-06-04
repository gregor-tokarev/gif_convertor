import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { Job, Worker } from "bullmq";
import * as Minio from "minio";
import { generateGif } from "./generateGif";
import { ConvertJob, MAIN_BUCKET_NAME, QUEUE_CONVERT } from "contracts";

// Ensure the uploads directory exists
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

const minio = new Minio.Client({
    endPoint: "localhost",
    accessKey: "minio",
    port: 9000,
    secretKey: "minio123",
    useSSL: false,
});

const worker = new Worker<ConvertJob>(
    QUEUE_CONVERT,
    async (job: Job) => {
        const inputFilePath = job.data.filePath;
        if (!inputFilePath) {
            return;
        }

        const tempFilePath = path.join("uploads", `${Date.now()}-${path.basename(inputFilePath)}`);
        await minio.fGetObject(MAIN_BUCKET_NAME, inputFilePath, tempFilePath);

        const outputFileName = `${Date.now()}-${path.basename(inputFilePath)}-output.gif`;
        const outputFilePath = path.join("uploads", outputFileName);

        const gifTempPath = await generateGif(tempFilePath, outputFilePath);

        await minio.fPutObject(MAIN_BUCKET_NAME, outputFileName, gifTempPath, { "Content-Type": "image/gif" });
        await Promise.all([job.updateProgress(100), job.updateData({ ...job.data, gifPath: outputFileName })]);
    },
    {
        autorun: false,
        connection: { host: "localhost", port: 6379, password: "redis" },
        removeOnComplete: { age: 1000 },
    },
);

worker.run().then((r) => console.log(r));
