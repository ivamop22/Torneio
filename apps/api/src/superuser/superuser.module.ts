import { Module } from '@nestjs/common';
import { SuperuserController } from './superuser.controller';

@Module({
  controllers: [SuperuserController],
})
export class SuperuserModule {}
