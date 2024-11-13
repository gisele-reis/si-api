import { Response } from 'express';
import { Body, Controller, Get, Param, Post, Put, Res } from '@nestjs/common';
import { TermsOfUseService } from './terms-of-use.service';

@Controller('terms')
export class TermsOfUseController {
  constructor(private readonly termsService: TermsOfUseService) {}

  @Post('create')
  createTerm(
    @Body('description') description: string,
    @Body('isMandatory') isMandatory: boolean,
    @Body('details') details: string,
    @Body('items') items: { name: string; description: string }[],
  ) {
    return this.termsService.createTerm(description, isMandatory, details, items);
  }

  @Get()
  getTerms() {
    return this.termsService.getTerms();
  }

  @Get(':termId/items')
  async getConsentItems(
    @Param('termId') termId: string,  
  ) {
    try {
      const consentItems = await this.termsService.getConsentItemsByTerm(termId);
      return consentItems;
    } catch (error) {
      return {
        statusCode: 404,
        message: error.message,
      };
    }
  }

  @Post(':termId/items')
  createConsentItem(
    @Param('termId') termId: string,
    @Body('title') title: string,
    @Body('description') description: string,
  ) {
    return this.termsService.createConsentItem(termId, title, description);
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
