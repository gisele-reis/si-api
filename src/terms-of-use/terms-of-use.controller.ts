import { Response } from 'express';
import { Body, Controller, Get, Param, Post, Put, Res } from '@nestjs/common';
import { TermsOfUseService } from './terms-of-use.service';

@Controller('terms')
export class TermsOfUseController {
  constructor(private readonly termsService: TermsOfUseService) {}

  @Post('create')
createTerm(@Body() body: { title: string; description: string; items: { title: string; description: string; isMandatory: boolean }[] }) {
  return this.termsService.createTerm(body.title, body.description, body.items);
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
createItem(@Param('termId') termId: string, @Body() body: { description: string; isMandatory: boolean }) {
  return this.termsService.createConsentItem(termId, body.description, body.isMandatory);
}

@Post('accept')
acceptItems(@Body() body: { userId: string; itemIds: string[] }) {
  return this.termsService.acceptItems(body.userId, body.itemIds);
}

@Get()
listTerms() {
  return this.termsService.getTerms();
}

@Get(':termId/items')
listItems(@Param('termId') termId: string) {
  return this.termsService.getConsentItemsByTerm(termId);
}
}
