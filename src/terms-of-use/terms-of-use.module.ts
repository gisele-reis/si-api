import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermsOfUseService } from './terms-of-use.service';
import { TermsOfUseController } from './terms-of-use.controller';
import { TermsOfUse } from './entities/terms-of-use.entity';
import { User } from '../users/entities/users.entity';
import { ConsentItem } from './entities/consent-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, TermsOfUse, ConsentItem])],
  providers: [TermsOfUseService],
  controllers: [TermsOfUseController],
  exports: [TermsOfUseService, TypeOrmModule],
})
export class TermsOfUseModule {}
