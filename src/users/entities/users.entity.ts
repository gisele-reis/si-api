import { ConsentItem } from 'src/terms-of-use/entities/consent-item.entity';
import { TermsOfUse } from 'src/terms-of-use/entities/terms-of-use.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column()
  peso: string;

  @Column()
  altura: string;

  @Column({ nullable: true })
  photoUrl?: string;
  
  @ManyToMany(() => TermsOfUse, { eager: true }) 
  @JoinTable()
  pendingTerms: TermsOfUse[]; 

  
  @ManyToMany(() => TermsOfUse, (term) => term.acceptedUsers)
  @JoinTable()
  acceptedTerms: TermsOfUse[];

  @ManyToMany(() => ConsentItem)
  @JoinTable()
  acceptedItems: ConsentItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
