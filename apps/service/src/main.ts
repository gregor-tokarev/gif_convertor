import express, { Request, Response } from "express";
import multer, { Multer } from "multer";
import cors from "cors";
import { Queue } from "bullmq";
import * as Minio from "minio";
import * as path from "path";
import { ConvertJob, MAIN_BUCKET_NAME, QUEUE_CONVERT } from "contracts";
import { multerMinioStorage } from "multer-minio";
import { config } from "dotenv";

config({ path: ".local.env" });

// Create an instance of the Express application
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const queue = new Queue<ConvertJob>(QUEUE_CONVERT, {
    connection: {
        host: process.env.REDIS_HOST ?? "",
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
    },
});

const minio = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "",
    port: Number(process.env.MINIO_PORT),
    secretKey: process.env.MINIO_SECRET_KEY ?? "",
    useSSL: process.env.MINIO_USE_SSL === "true",
});

const storage = multerMinioStorage({ minio, bucketName: MAIN_BUCKET_NAME });

const upload: Multer = multer({ storage });

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint for converting MP4 to GIF
app.post("/convert", upload.single("video"), async (req: Request, res: Response) => {
    const inputFilePath = req.file?.path;
    if (!inputFilePath) {
        return res.status(400).send("No video file uploaded.");
    }

    const job = await queue.add("convert", { filePath: path.basename(inputFilePath) });

    res.status(200).json(job);
});

app.get("/status", async (req: Request, res: Response) => {
    const jobIds = req.query["jobId"]?.toString();
    if (!jobIds) {
        return res.status(400).send("No job ID provided");
    }
    const ids = jobIds.split(",");

    const jobs = await Promise.all(ids.map((id) => queue.getJob(id)));
    if (!jobs.length) {
        return res.status(404).send("Jobs not found");
    }

    res.status(200).send(jobs);
});

// Start the server
minio
    .bucketExists(MAIN_BUCKET_NAME)
    .then((res) => (res ? Promise.resolve() : minio.makeBucket(MAIN_BUCKET_NAME)))
    .then(() => app.listen(port));
