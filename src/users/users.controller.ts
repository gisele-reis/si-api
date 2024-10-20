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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/users.entity';
import { CreateUserDto } from './create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    console.log(req.user);
    const userId = req.user.id;
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

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() user: Partial<User>) {
    return this.usersService.update(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

