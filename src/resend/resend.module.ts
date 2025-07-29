import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ResendService } from './resend.service';
@Module({
  providers: [
    {
      provide: 'RESEND',
      useFactory: (config: ConfigService) => {
        return new Resend(config.get('RESEND_API_KEY'));
      },
      inject: [ConfigService],
    },
    ResendService,
  ],
  exports: ['RESEND', ResendService],
})
export class ResendModule {}