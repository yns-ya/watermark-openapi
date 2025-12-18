import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WatermarkModule } from '@modules/watermark/watermark.module';
import { AuthModule } from '@modules/auth/auth.module';
import configuration from '@config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 30, // 30 requests
      },
    ]),

    // Feature modules
    AuthModule,
    WatermarkModule,
  ],
})
export class AppModule {}
