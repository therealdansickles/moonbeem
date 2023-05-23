import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Wallet } from '../wallet/wallet.entity';

@Entity({ name: 'Relationship' })
export class Relationship extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.followers, { createForeignKeyConstraints: false })
  @JoinColumn()
  follower: Wallet;

  @ManyToOne(() => Wallet, (wallet) => wallet.followings, { createForeignKeyConstraints: false })
  @JoinColumn()
  following: Wallet;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
