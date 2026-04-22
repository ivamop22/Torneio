import { Module, Controller, Get } from '@nestjs/common';

@Controller()
class AppController {
  @Get()
  health() {
    return { ok: true, service: 'api', port: 3001 };
  }
}

@Module({
  controllers: [AppController],
})
export class AppModule {}
