import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User } from './entities/users.entity';
import { CreateUserDto } from './create-user.dto';
import { TermsOfUse } from 'src/terms-of-use/entities/terms-of-use.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(TermsOfUse)
    private termsRepository: Repository<TermsOfUse>,
  ) {}

  private secretKey = crypto.randomBytes(32);
  private algorithm = 'aes-256-cbc';

  private encryptData(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const alturaCriptografada = this.encryptData(
      createUserDto.altura.toString(),
    );
    const pesoCriptografado = this.encryptData(createUserDto.peso.toString());

    const acceptedTerms = await this.getAcceptedTerms(
      createUserDto.acceptedTerms,
    );

    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      altura: alturaCriptografada,
      peso: pesoCriptografado,
      acceptedTerms,
    });

    return this.usersRepository.save(newUser);
  }
  private async getAcceptedTerms(termIds: string[]): Promise<TermsOfUse[]> {
    return this.termsRepository.findByIds(termIds);
  }

  public decryptData(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      iv,
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async findAll() {
    return this.usersRepository.find({
      where: { deletedAt: null },
      relations: ['acceptedTerms']
    });
  }
  

  async findByUsername(username: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { username } });

    if (user) {
      user.altura = this.decryptData(user.altura);
      user.peso = this.decryptData(user.peso);
    }

    return user;
  }

  findOne(id: string): Promise<User | null> {
    console.log('Buscando usuário com ID:', id);
    return this.usersRepository.findOne({
      where: { id },
      relations: ['acceptedTerms'],
    });
  }

  async update(id: string, user: Partial<User>) {
    if (user.altura) {
      user.altura = this.encryptData(user.altura.toString());
    }
    if (user.peso) {
      user.peso = this.encryptData(user.peso.toString());
    }

    await this.usersRepository.update(id, user);

    return this.findOne(id);
  }

  async anonymizeUser(id: string): Promise<User | void>  {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (user) {
      user.username = `anon_${id}`;
      user.altura = this.encryptData('0'); 
      user.name = `anonName_${id}`;
      user.peso = this.encryptData('0'); 
      user.password = await bcrypt.hash(id, 10);
      user.deletedAt = new Date(); 
      user.photoUrl = `anonPhoto_${id}`

      return this.usersRepository.save(user);
    }
  }
  
  
}
