import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/users.entity';
import { CreateUserDto } from './create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    console.log(req.user);
    return await this.usersService.findByUsername(req.user.username);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (user) {
      console.log('Antes da descriptografia:', user.altura, user.peso);
      user.altura = this.usersService.decryptData(user.altura);
      user.peso = this.usersService.decryptData(user.peso);
      console.log('Depois da descriptografia:', user.altura, user.peso);
    }
    return user;
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() user: Partial<User>) {
    return this.usersService.update(id, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.anonymizeUser(id);
  }
  

  private readonly uploadPath = path.join(__dirname, '..', 'uploads');

  @Post(':id/upload-photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }

    const user = await this.usersService.findOne(id);
    if (user && user.photoUrl) {
      const previousImagePath = path.join(
        __dirname,
        '..',
        'uploads',
        path.basename(user.photoUrl),
      );
      if (fs.existsSync(previousImagePath)) {
        fs.unlinkSync(previousImagePath);
        console.log('Imagem anterior removida:', previousImagePath);
      }
    }

    if (!fs.existsSync(this.uploadPath)) {
      console.log('Criando diretório de uploads:', this.uploadPath);
      fs.mkdirSync(this.uploadPath);
    }

    const fileName = `${id}-${Date.now()}${path.extname(file.originalname)}`;
    const filePath = path.join(this.uploadPath, fileName);
    fs.writeFileSync(filePath, file.buffer);
    console.log('Arquivo salvo em:', filePath);

    const photoUrl = `http://localhost:3000/uploads/${fileName}`;
    return this.usersService.update(id, { photoUrl });
  }
}
