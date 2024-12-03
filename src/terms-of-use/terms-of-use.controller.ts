import { Response } from 'express';
import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Res } from '@nestjs/common';
import { TermsOfUseService } from './terms-of-use.service';
import { TermsOfUse } from './entities/terms-of-use.entity';

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

@Get('users/:userId/accepted-items')
async getAcceptedItems(@Param('userId') userId: string) {
  return this.termsService.getAcceptedItemsByUser(userId);
}


@Delete('users/:userId/accepted-items/:itemId')
async removeAcceptedItem(
  @Param('userId') userId: string,
  @Param('itemId') itemId: string,
) {
  await this.termsService.removeAcceptedItem(userId, itemId);
  return { message: 'Item removido com sucesso' };
}

@Put(':termId')
async updateTerm(
  @Param('termId') termId: string,
  @Body()
  updates: {
    title?: string;
    description?: string;
    newItems?: { title: string; description: string; isMandatory: boolean }[];
  },
): Promise<TermsOfUse> {
  try {
    return await this.termsService.updateTerm(termId, updates);
  } catch (error) {
    if (error.message === 'Termo não encontrado') {
      throw new NotFoundException(error.message);
    }
    throw new BadRequestException(error.message || 'Erro ao atualizar o termo');
  }
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
