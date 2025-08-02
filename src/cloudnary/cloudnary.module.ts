import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Module({
  providers: [
    {
      provide: 'CLOUDINARY',
      useFactory: (config: ConfigService) => {
        return cloudinary.config({
          cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
          api_key: config.get('CLOUDINARY_API_KEY'),
          api_secret: config.get('CLOUDINARY_API_SECRET'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['CLOUDINARY'],
})
export class CloudinaryModule {}