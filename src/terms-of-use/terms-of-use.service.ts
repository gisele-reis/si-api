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

  async createTerm(title: string, description: string, items: { title: string; description: string; isMandatory: boolean }[]) {
    const term = this.termsRepository.create({
      title,
      description,
      items: items.map((item) =>
        this.consentItemRepository.create({ title: item.title, description: item.description, isMandatory: item.isMandatory }),
      ),
    });
  
    return this.termsRepository.save(term);
  }
  
  async createConsentItem(termId: string, description: string, isMandatory: boolean) {
    const term = await this.termsRepository.findOne({ where: { id: termId } });
    if (!term) throw new Error('Termo não encontrado');
  
    const item = this.consentItemRepository.create({ description, isMandatory, term });
    return this.consentItemRepository.save(item);
  }
  
  async acceptItems(userId: string, itemIds: string[]) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['acceptedItems', 'acceptedTerms'],
    });
  
    if (!user) throw new Error('Usuário não encontrado');
    const items = await this.consentItemRepository.find({
      where: { id: In(itemIds) },
      relations: ['term'], 
    });
  
    const termsToAccept = new Set(items.map((item) => item.term.id));
    user.acceptedItems.push(...items);  
    user.acceptedTerms = await this.termsRepository.findByIds([...termsToAccept]); 
  
    await this.usersRepository.save(user);  
  
    return user;
  }
  

  async getTerms(): Promise<TermsOfUse[]> {
    return this.termsRepository.find();
  }

  async updateTerm(
    termId: string,
    updates: {
      title?: string;
      description?: string;
      newItems?: { title: string; description: string; isMandatory: boolean }[];
    }
  ): Promise<TermsOfUse> {
    const term = await this.termsRepository.findOne({
      where: { id: termId },
      relations: ['items'],
    });
  
    if (!term) throw new Error('Termo não encontrado');
  
    if (updates.title) term.title = updates.title;
    if (updates.description) term.description = updates.description;
  
    if (updates.newItems && updates.newItems.length > 0) {
      const newConsentItems = updates.newItems.map((item) =>
        this.consentItemRepository.create({
          title: item.title,
          description: item.description,
          isMandatory: item.isMandatory,
          term,
        })
      );
      term.items.push(...newConsentItems);
    }

    term.version += 1;
  
    const updatedTerm = await this.termsRepository.save(term);
  
    await this.notifyUsersAboutTermUpdate(termId);
  
    return updatedTerm;
  }
  

  private async notifyUsersAboutTermUpdate(termId: string): Promise<void> {
    const term = await this.termsRepository.findOne({
      where: { id: termId },
      relations: ['acceptedUsers'], 
    });
  
    if (!term) throw new Error('Termo não encontrado');
  
    const usersToUpdate = term.acceptedUsers;
  
    for (const user of usersToUpdate) {
      if (!user.pendingTerms.some((t) => t.id === termId)) {
        user.pendingTerms.push(term);
        await this.usersRepository.save(user); 
      }
    }
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

  async getAcceptedItemsByUser(userId: string): Promise<ConsentItem[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['acceptedItems'], 
    });
  
    if (!user) throw new Error('Usuário não encontrado');
  
    return user.acceptedItems; 
  }

  async removeAcceptedItem(userId: string, itemId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['acceptedItems'],
    });
  
    if (!user) throw new Error('Usuário não encontrado');
  
    user.acceptedItems = user.acceptedItems.filter(item => item.id !== itemId);
  
    await this.usersRepository.save(user);
  }
  
  
}

