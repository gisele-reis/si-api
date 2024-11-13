// TermsOfUse.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, OneToMany } from 'typeorm';
import { User } from 'src/users/entities/users.entity';
import { ConsentItem } from './consent-item.entity';

@Entity()
export class TermsOfUse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column()
  details: string;

  @Column({ default: false })
  isMandatory: boolean;

  @OneToMany(() => ConsentItem, (item) => item.term, { cascade: true })
  items: ConsentItem[];

  @ManyToMany(() => User, (user) => user.acceptedTerms)
  users: User[];
}
