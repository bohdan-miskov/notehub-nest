import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NoteTag } from '../enums/note-tag.enum';

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
}
