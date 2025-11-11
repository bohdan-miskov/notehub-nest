import { Exclude } from 'class-transformer';
import { Note } from 'src/notes/entities/note.entity';
import { Session } from 'src/sessions/entities/session.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Note, (note) => note.user)
  @Exclude({ toPlainOnly: true })
  notes: Note[];

  @OneToMany(() => Session, (session) => session.user)
  @Exclude({ toPlainOnly: true })
  sessions: Session[];
}
