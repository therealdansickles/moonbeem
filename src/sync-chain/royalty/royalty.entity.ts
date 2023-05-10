import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'Royalty' })
export class Royalty extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 0, comment: 'Block height of transaction.' })
    height: number;

    @Column({ comment: 'Transaction hash of transaction.' })
    txHash: string;

    @Column({ comment: 'Transaction time of transaction.' })
    txTime: string;

    @Column({ comment: 'Transaction sender of transaction.' })
    sender: string;

    @Column({ length: 64, comment: 'The contract address' })
    address: string;

    @Column({ comment: 'The address of user' })
    userAddress: string;

    @Column({ comment: 'The royalty rate in percentage of user.' })
    userRate: number;

    @Column({ default: 1, comment: 'The chain id for the royalty contract.' })
    chainId?: number;

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;
}
