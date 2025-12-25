import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';

interface MulterFile extends Express.Multer.File {
  buffer: Buffer;
}

@Injectable()
export class FilesService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const multerFile = file as MulterFile;
    const buffer = multerFile.buffer;

    const response = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.configService.get<string>('CLOUDINARY_FOLDER_NAME'),
          public_id: `avatar_${randomUUID()}`,
          overwrite: false,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            return reject(
              new BadRequestException(
                `Cloudinary upload failed: ${error.message}`,
              ),
            );
          }
          if (!result) {
            return reject(
              new BadRequestException('Cloudinary upload result is undefined'),
            );
          }
          resolve(result);
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });

    return response.secure_url;
  }
}
