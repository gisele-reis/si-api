import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
    const alturaCriptografada = this.encryptData(createUserDto.altura.toString());
    const pesoCriptografado = this.encryptData(createUserDto.peso.toString());

    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      altura: alturaCriptografada,
      peso: pesoCriptografado,
    });

    return this.usersRepository.save(newUser);
  }

  public decryptData(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex'); // Pegar o IV
    const encryptedText = parts.join(':'); // O restante é o texto criptografado
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  findAll() {
    return this.usersRepository.find();
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
    return this.usersRepository.findOne({ where: { id } }); 
  }

  update(id: string, user: Partial<User>) {
    return this.usersRepository.update(id, user);
  }

  remove(id: string) {
    return this.usersRepository.delete(id);
  }
}
