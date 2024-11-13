import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './entities/users.entity';
import { CreateUserDto } from './create-user.dto';
import { TermsOfUse } from 'src/terms-of-use/entities/terms-of-use.entity';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class UsersService implements OnModuleInit{
  private s3Client = new S3Client({ region: process.env.AWS_REGION });
  private bucketName = 'shorts-bucket';
  private exclusionListFileKey = 'exclusionList.json';

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(TermsOfUse)
    private termsRepository: Repository<TermsOfUse>,
  ) {}

  private secretKey = crypto.randomBytes(32);
  private algorithm = 'aes-256-cbc';

  async onModuleInit() {
    await this.syncExclusions();
  }
  private async syncExclusions() {
    try {
      const data = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: this.exclusionListFileKey,
      }));

      const exclusionList: string[] = JSON.parse(await this.streamToString(data.Body));

      for (const userId of exclusionList) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (user) {
          await this.usersRepository.remove(user);
          console.log(`Usuário ${userId} excluído do banco de dados.`);
        }
      }

      console.log('Sincronização de exclusões completada com sucesso.');
    } catch (error) {
      console.error('Erro ao sincronizar exclusões:', error);
    }
  }

  private async streamToString(stream): Promise<string> {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }
  
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
    return this.usersRepository.find({ relations: ['acceptedTerms'] });
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (user) {
      user.altura = this.decryptData(user.altura);
      user.peso = this.decryptData(user.peso);
    }
    return user;
  }

  async getPendingTerms(
    userId: string,
  ): Promise<{ description: string; details: string }[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['pendingTerms'],
    });

    console.log('Usuário encontrado:', user);

    if (!user || !user.pendingTerms || user.pendingTerms.length === 0) {
      return [];
    }

    return user.pendingTerms.map((term) => ({
      id: term.id,
      description: term.description,
      details: term.details,
      isMandatory: term.isMandatory,
    }));
  }

  async removePendingTerm(userId: string, termId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['pendingTerms'],
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    user.pendingTerms = user.pendingTerms.filter((term) => term.id !== termId);

    await this.usersRepository.save(user);
  }

  findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['acceptedTerms'],
    });
  }

  async update(id: string, user: Partial<User>) {
    if (user.altura) user.altura = this.encryptData(user.altura.toString());
    if (user.peso) user.peso = this.encryptData(user.peso.toString());
    await this.usersRepository.update(id, user);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    console.log(`Tentando remover usuário com ID: ${id}`);
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    await this.usersRepository.delete(id);
    console.log(`Usuário ${id} excluído com sucesso.`);
    this.recordExclusion(id);
  }

  private async recordExclusion(userId: string) {
    let exclusionList: string[] = [];

    try {
      const data = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: this.exclusionListFileKey,
        }),
      );

      const streamToString = (stream: Readable) =>
        new Promise<string>((resolve, reject) => {
          const chunks: Uint8Array[] = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () =>
            resolve(Buffer.concat(chunks).toString('utf-8')),
          );
          stream.on('error', reject);
        });

      const fileContents = await streamToString(data.Body as Readable);
      exclusionList = JSON.parse(fileContents);
    } catch (error) {
      if (error.name !== 'NoSuchKey') {
        throw error;
      }
      console.log('Lista de exclusão não encontrada no S3, criando novo.');
    }

    if (!exclusionList.includes(userId)) {
      exclusionList.push(userId);
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: this.exclusionListFileKey,
          Body: JSON.stringify(exclusionList, null, 2),
          ContentType: 'application/json',
        }),
      );

      console.log('ID adicionado à lista de exclusão no S3:', userId);
    } else {
      console.log('ID já está na lista de exclusão:', userId);
    }
  }
}