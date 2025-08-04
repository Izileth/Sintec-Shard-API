import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Module({
  providers: [
    {
      provide: 'CLOUDINARY',
      useFactory: (config: ConfigService) => {
        const cloudName: string = config.get('CLOUDINARY_CLOUD_NAME') ?? '';
        const apiKey: string = config.get('CLOUDINARY_API_KEY') ?? '';
        const apiSecret: string = config.get('CLOUDINARY_API_SECRET') ?? '';

        // Validar se todas as variáveis estão configuradas
        if (!cloudName || !apiKey || !apiSecret) {
          console.error('Cloudinary configuration missing:', {
            cloudName: !!cloudName,
            apiKey: !!apiKey,
            apiSecret: !!apiSecret,
          });
          throw new Error('Cloudinary configuration incomplete');
        }

        // Configurar o cloudinary
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });

        console.log('Cloudinary configured successfully for cloud:', cloudName);
        // Retornar a instância completa do cloudinary
        return cloudinary;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['CLOUDINARY'],
})
export class CloudinaryModule {}
