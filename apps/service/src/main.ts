import express, { Request, Response } from "express";
import multer, { Multer } from "multer";
import fs from "fs";
import cors from "cors";
import { Queue } from "bullmq";
import * as Minio from "minio";
import * as path from "path";
import { ConvertJob, MAIN_BUCKET_NAME, QUEUE_CONVERT } from "contracts";

// Create an instance of the Express application
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const queue = new Queue<ConvertJob>(QUEUE_CONVERT, {
    connection: { host: "localhost", port: 6379, password: "redis" },
});

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, "uploads/");
    },
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const minio = new Minio.Client({
    endPoint: "localhost",
    port: 9000,
    accessKey: "minio",
    secretKey: "minio123",
    useSSL: false,
});

const upload: Multer = multer({ storage });

// Ensure the uploads directory exists
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint for converting MP4 to GIF
app.post("/convert", upload.single("video"), async (req: Request, res: Response) => {
    const inputFilePath = req.file?.path;
    if (!inputFilePath) {
        return res.status(400).send("No video file uploaded.");
    }

    await minio.fPutObject(MAIN_BUCKET_NAME, path.basename(inputFilePath), inputFilePath);

    const job = await queue.add("convert", { filePath: path.basename(inputFilePath) });

    res.status(200).json(job);
});

app.get("/status", async (req: Request, res: Response) => {
    const jobId = req.query["jobId"]?.toString();
    if (!jobId) {
        return res.status(400).send("No job ID provided");
    }

    const job = await queue.getJob(jobId);
    if (!job) {
        return res.status(404).send("Job not found");
    }

    res.status(200).send(job);
});

// Start the server
minio
    .bucketExists("uploads")
    .then((res) => (res ? Promise.resolve() : minio.makeBucket("uploads")))
    .then(() => app.listen(port));
