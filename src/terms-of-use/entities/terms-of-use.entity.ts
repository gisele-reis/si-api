import { User } from 'src/users/entities/users.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';

@Entity()
export class TermsOfUse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @ManyToMany(() => User, (user) => user.acceptedTerms)
  users: User[];
}
