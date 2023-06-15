import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'Royalty' })
export class Royalty extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ default: 0, comment: 'Block height of transaction.' })
    readonly height: number;

    @Column({ comment: 'Transaction hash of transaction.' })
    readonly txHash: string;

    @Column({ comment: 'Transaction time of transaction.' })
    readonly txTime: string;

    @Column({ comment: 'Transaction sender of transaction.' })
    readonly sender: string;

    @Column({ length: 64, comment: 'The contract address' })
    readonly address: string;

    @Column({ comment: 'The address of user' })
    readonly userAddress: string;

    @Column({ comment: 'The royalty rate in percentage of user.' })
    readonly userRate: number;

    @Column({ default: 1, comment: 'The chain id for the royalty contract.' })
    readonly chainId?: number;

    @CreateDateColumn()
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
