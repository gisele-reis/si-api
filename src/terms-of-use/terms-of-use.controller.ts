import { Response } from 'express';
import { Body, Controller, Get, Param, Post, Put, Res } from '@nestjs/common';
import { TermsOfUseService } from './terms-of-use.service';

@Controller('terms')
export class TermsOfUseController {
  constructor(private readonly termsService: TermsOfUseService) {}

  @Post('create')
  createTerm(@Body('description') description: string, @Body('isMandatory') isMandatory: boolean, @Body('details') details: string) {
    return this.termsService.createTerm(description, isMandatory, details);
  }

  @Put(':id')
  updateTerm(@Param('id') id: string, @Body() body: { description: string; isMandatory: boolean, details:string }) {
    return this.termsService.updateTerm(id, body.description, body.isMandatory, body.details);
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
