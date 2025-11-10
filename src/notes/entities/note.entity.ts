import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NoteTag } from '../enums/note-tag.enum';
import { User } from 'src/users/entities/user.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ default: false })
  isDone: boolean;

  @Column({
    type: 'enum',
    enum: NoteTag,
    default: NoteTag.Todo,
  })
  tag: NoteTag;

  @ManyToOne(() => User, (user) => user.notes, { eager: false })
  @Exclude({ toPlainOnly: true })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
