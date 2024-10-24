import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { TermsOfUse } from 'src/terms-of-use/entities/terms-of-use.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, TermsOfUse])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
