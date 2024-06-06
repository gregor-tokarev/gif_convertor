import { spawn } from "child_process";

export function generateGif(inputFilePath: string, outputFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        console.time("Processing video " + outputFilePath);
        const ffmpeg = spawn("ffmpeg", [
            "-i",
            inputFilePath,
            "-t",
            "10",
            "-vf",
            "fps=5,scale=-1:400",
            "-c:v",
            "gif",
            outputFilePath,
        ]);

        ffmpeg.on("close", (_code) => {
            console.timeEnd("Processing video " + outputFilePath);
            resolve(outputFilePath);
        });
    });
}
