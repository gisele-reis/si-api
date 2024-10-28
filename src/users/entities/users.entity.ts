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

  @ManyToMany(() => TermsOfUse, (termsOfUse) => termsOfUse.users)
  @JoinTable()
  acceptedTerms: TermsOfUse[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null; 

}
