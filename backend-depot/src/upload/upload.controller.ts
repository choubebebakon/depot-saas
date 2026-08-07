import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return {
      url: `/uploads/${file.filename}`,
      message: 'Image uploadée avec succès',
    };
  }
}
