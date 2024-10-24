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

  async createTerm(description: string): Promise<TermsOfUse> {
    const newTerm = this.termsRepository.create({ description });
    return this.termsRepository.save(newTerm);
  }

  async getTerms(): Promise<TermsOfUse[]> {
    return this.termsRepository.find();
  }

  async acceptTerms(userId: string, termIds: string[]): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['acceptedTerms'],
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
    await this.usersRepository.save(user);

    return { statusCode: 200, message: 'Termos aceitos com sucesso!' };
  }
}
