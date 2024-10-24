import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermsOfUse } from './entities/terms-of-use.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/users.entity';

@Injectable()
export class TermsOfUseService {
  constructor(
    @InjectRepository(TermsOfUse)
    private termsRepository: Repository<TermsOfUse>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createTerm(description: string): Promise<TermsOfUse> {
    const newTerm = this.termsRepository.create({ description });
    return this.termsRepository.save(newTerm);
  }

  async getTerms(): Promise<TermsOfUse[]> {
    return this.termsRepository.find();
  }

  async acceptTerm(userId: string, termId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['acceptedTerms'],
    });
    const term = await this.termsRepository.findOne({ where: { id: termId } });

    if (user && term) {
      user.acceptedTerms.push(term);
      await this.usersRepository.save(user);
    }
  }
}
