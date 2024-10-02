import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  peso: number;

  @Column('decimal', { precision: 10, scale: 2 })
  altura: number;

  @Column()
  termos: boolean;
}
