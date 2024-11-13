import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { TermsOfUse } from './terms-of-use.entity';

@Entity()
export class ConsentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToOne(() => TermsOfUse, (termsOfUse) => termsOfUse.items)
  term: TermsOfUse;
}
