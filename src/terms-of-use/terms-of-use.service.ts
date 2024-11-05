import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermsOfUse } from './entities/terms-of-use.entity';
import { In, Repository } from 'typeorm';
import { User } from 'src/users/entities/users.entity';

@Injectable()
export class TermsOfUseService {
  constructor(
    @InjectRepository(TermsOfUse)
    private termsRepository: Repository<TermsOfUse>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createTerm(description: string, isMandatory: boolean, details: string): Promise<TermsOfUse> {
    const newTerm = this.termsRepository.create({ description, details, isMandatory });
    const savedTerm = await this.termsRepository.save(newTerm);
  
    const users = await this.usersRepository.find({ relations: ['acceptedTerms', 'pendingTerms'] });
    for (const user of users) {
        if (!user.acceptedTerms.some(term => term.id === savedTerm.id)) {
            if (!user.pendingTerms || !user.pendingTerms.some(term => term.id === savedTerm.id)) {
                user.pendingTerms = [...(user.pendingTerms || []), savedTerm]; 
                await this.usersRepository.save(user);
            }
        }
    }
  
    return savedTerm;
}

async updateTerm(id: string, description: string, isMandatory: boolean, details: string): Promise<TermsOfUse> {
  const updatedTerm = await this.termsRepository.findOne({ where: { id } });
  if (!updatedTerm) throw new Error('Termo não encontrado');

  await this.termsRepository.update(id, { description, isMandatory, details });

  const users = await this.usersRepository.find({ relations: ['acceptedTerms', 'pendingTerms'] });
  for (const user of users) {
      if (!user.acceptedTerms.some(term => term.id === id)) {
          if (!user.pendingTerms || !user.pendingTerms.some(term => term.id === updatedTerm.id)) {
              user.pendingTerms = [...(user.pendingTerms || []), updatedTerm]; 
              await this.usersRepository.save(user);
          }
      }
  }

  return this.termsRepository.findOne({ where: { id } });
}
  
  async getTerms(): Promise<TermsOfUse[]> {
    return this.termsRepository.find();
  }

  async acceptTerms(userId: string, termIds: string[]): Promise<any> {
    const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['acceptedTerms', 'pendingTerms'],
    });

    if (!user) {
        return { statusCode: 404, message: 'Usuário não encontrado' };
    }
    const terms = await this.termsRepository.find({
        where: {
            id: In(termIds),
        },
    });

    const acceptedTermIds = user.acceptedTerms.map((t) => t.id);
    const newTerms = terms.filter((term) => !acceptedTermIds.includes(term.id));

    if (newTerms.length === 0) {
        return {
            statusCode: 400,
            message: 'Todos os termos já foram aceitos pelo usuário',
        };
    }
    user.acceptedTerms.push(...newTerms);
    user.pendingTerms = user.pendingTerms.filter(term => !termIds.includes(term.id));
    
    await this.usersRepository.save(user);

    return { statusCode: 200, message: 'Termos aceitos com sucesso!' };
}

}
