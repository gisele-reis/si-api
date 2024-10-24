import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermsOfUseService } from './terms-of-use.service';
import { TermsOfUseController } from './terms-of-use.controller';
import { TermsOfUse } from './entities/terms-of-use.entity';
import { User } from '../users/entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, TermsOfUse])],
  providers: [TermsOfUseService],
  controllers: [TermsOfUseController],
  exports: [TermsOfUseService],
})
export class TermsOfUseModule {}
