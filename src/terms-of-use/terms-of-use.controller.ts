import { Response } from 'express';
import { Body, Controller, Get, Post, Res } from '@nestjs/common';
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
  async acceptTerms(
    @Body('userId') userId: string,
    @Body('termIds') termIds: string[],
    @Res() res: Response,
  ) {
    const result = await this.termsService.acceptTerms(userId, termIds);

    return res.status(result.statusCode).json(result);
  }
}
