import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermsOfUse } from './entities/terms-of-use.entity';
import { In, Repository } from 'typeorm';
import { User } from 'src/users/entities/users.entity';
import { ConsentItem } from './entities/consent-item.entity';


@Injectable()
export class TermsOfUseService {
  constructor(
    @InjectRepository(TermsOfUse)
    private termsRepository: Repository<TermsOfUse>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ConsentItem)
    private consentItemRepository: Repository<ConsentItem>,
  ) {}

  async createTerm(
    description: string,
    isMandatory: boolean,
    details: string,
    items: { name: string; description: string }[],
  ): Promise<TermsOfUse> {
    const newTerm = this.termsRepository.create({
      description,
      details,
      isMandatory,
      items: items.map(item => this.termsRepository.manager.create(ConsentItem, item)),
    });
    const savedTerm = await this.termsRepository.save(newTerm);
    const users = await this.usersRepository.find({
      relations: ['acceptedTerms', 'pendingTerms'],
    });
    for (const user of users) {
      if (!user.acceptedTerms.some((term) => term.id === savedTerm.id)) {
        if (!user.pendingTerms || !user.pendingTerms.some((term) => term.id === savedTerm.id)) {
          user.pendingTerms = [...(user.pendingTerms || []), savedTerm];
          await this.usersRepository.save(user);
        }
      }
    }
    
    return savedTerm;
  }

  async createConsentItem(
    termId: string,
    title: string,
    description: string,
  ): Promise<ConsentItem> {
    const term = await this.termsRepository.findOne({ where: { id: termId } });
    if (!term) throw new Error('Termo não encontrado');

    const consentItem = this.consentItemRepository.create({
      title,
      description,
      term,
    });
    return this.consentItemRepository.save(consentItem);
  }

  async updateTerm(
    id: string,
    description: string,
    isMandatory: boolean,
    details: string,
  ): Promise<TermsOfUse> {
    const updatedTerm = await this.termsRepository.findOne({ where: { id } });
    if (!updatedTerm) throw new Error('Termo não encontrado');
    await this.termsRepository.update(id, {
      description,
      isMandatory,
      details,
    });
    const users = await this.usersRepository.find({
      relations: ['pendingTerms'],
    });
    for (const user of users) {
      if (!user.pendingTerms.some((term) => term.id === updatedTerm.id)) {
        user.pendingTerms = [...(user.pendingTerms || []), updatedTerm];
        await this.usersRepository.save(user);
      }
    }

    return this.termsRepository.findOne({ where: { id } });
  }

  async getTerms(): Promise<TermsOfUse[]> {
    return this.termsRepository.find();
  }

  async acceptTerms(userId: string, itemIds: string[]): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['acceptedTerms', 'pendingTerms'],
    });
  
    if (!user) {
      return { statusCode: 404, message: 'Usuário não encontrado' };
    }
  
    const items = await this.consentItemRepository.find({
      where: { id: In(itemIds) },
      relations: ['term'],
    });
  
    const termsToAccept = new Set(items.map(item => item.term));
    user.acceptedTerms.push(...termsToAccept);

    user.pendingTerms = user.pendingTerms.filter(
      term => !termsToAccept.has(term)
    );
  
    await this.usersRepository.save(user);
  
    return { statusCode: 200, message: 'Itens de consentimento aceitos com sucesso!' };
  }

  async getConsentItemsByTerm(termId: string): Promise<ConsentItem[]> {
    const term = await this.termsRepository.findOne({
      where: { id: termId },
      relations: ['items'], 
    });
    if (!term) {
      throw new Error('Termo não encontrado');
    }
    return term.items;
  }
}
