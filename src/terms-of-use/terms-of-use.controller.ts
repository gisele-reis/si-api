import { Body, Controller, Get, Post } from '@nestjs/common';
import { TermsOfUseService } from './terms-of-use.service';

@Controller('terms')
export class TermsOfUseController {
  constructor(private readonly termsService: TermsOfUseService) {}

  @Post('create')
  createTerm(@Body('description') description: string) {
    return this.termsService.createTerm(description);
  }

  @Get()
  getTerms() {
    return this.termsService.getTerms();
  }

  @Post('accept')
  acceptTerm(@Body('userId') userId: string, @Body('termId') termId: string) {
    return this.termsService.acceptTerm(userId, termId);
  }
}
