import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { ConsentItem } from './consent-item.entity';
import { User } from 'src/users/entities/users.entity';

@Entity()
export class TermsOfUse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @OneToMany(() => ConsentItem, (item) => item.term, { cascade: true })
  items: ConsentItem[];

  @ManyToMany(() => User, (user) => user.acceptedTerms)
  @JoinTable()
  acceptedUsers: User[];
}
