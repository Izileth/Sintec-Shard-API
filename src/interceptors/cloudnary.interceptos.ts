
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from 'src/cloudnary/types/cloudnary.reponse.type';
@Injectable()
export class CloudinaryInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;

    if (file) {
      try {
        const result = await new Promise<CloudinaryResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryResponse);
            }
        );
        
        uploadStream.end(file.buffer);
        });

        request.body.imageUrl = result.secure_url;
      } catch (error) {
        throw new Error('Falha no upload da imagem');
      }
    }

    return next.handle();
  }
}