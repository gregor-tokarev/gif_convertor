import express, { Request, Response } from "express";
import multer, { Multer } from "multer";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

// Create an instance of the Express application
const app = express();
const port = process.env.PORT || 3000;

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
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
app.post("/convert", upload.single("video"), (req: Request, res: Response) => {
  const inputFilePath = req.file?.path;
  if (!inputFilePath) {
    return res.status(400).send("No video file uploaded.");
  }

  const outputFileName = `${Date.now()}-output.gif`;
  const outputFilePath = path.join("uploads", outputFileName);

  ffmpeg(inputFilePath)
    .setDuration(10)
    .fps(5)
    .size("-1x400")
    .output(outputFilePath)
    .on("end", () => {
      res.download(outputFilePath, (err) => {
        if (err) {
          console.error(err);
        }
        // Clean up temporary files
        // fs.unlinkSync(inputFilePath);
        // fs.unlinkSync(outputFilePath);
      });
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).send("Error processing video");
      fs.unlinkSync(inputFilePath);
    })
    .run();
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
