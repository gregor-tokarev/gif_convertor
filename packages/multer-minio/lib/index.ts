import { Request } from "express";
import { StorageEngine } from "multer";
import { Client } from "minio";

export interface MulterMinioStorageOptions {
    minio: Client;
    bucketName: string;
}

class MulterMinioStorage implements StorageEngine {
    private minio: Client;
    private readonly bucketName: string;

    constructor(opts: MulterMinioStorageOptions) {
        this.minio = opts.minio;
        this.bucketName = opts.bucketName;
    }

    async _handleFile(
        _req: Request,
        file: Express.Multer.File,
        cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
    ): Promise<void> {
        const fileName = `${Date.now()}-${file.originalname}`;

        try {
            await this.minio.putObject(this.bucketName, fileName, file.stream, file.size);

            cb(null, {
                mimetype: file.mimetype,
                fieldname: file.fieldname,
                originalname: file.originalname,
                path: fileName,
            });
        } catch (err) {
            cb(err as Error);
        }
    }

    async _removeFile(_req: Request, file: Express.Multer.File, cb: (error: Error | null) => void): Promise<void> {
        try {
            await this.minio.removeObject(this.bucketName, file.path);
            cb(null);
        } catch (err) {
            cb(err as Error);
        }
    }
}

export function multerMinioStorage(opts: MulterMinioStorageOptions): StorageEngine {
    return new MulterMinioStorage(opts);
}
