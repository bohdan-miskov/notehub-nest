import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  @Index()
  refreshTokenHash: string;

  @Column()
  expiresAt: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;
}
