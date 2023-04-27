import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'Record721' })
export class Record721 extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: 'Block height of transaction.' })
    height: number;

    @Column({ comment: 'Transaction hash of transaction.' })
    txHash: string;

    @Column({ comment: 'Transaction time of transaction.' })
    txTime: number;

    @Column({ comment: 'The contract address.' })
    address: string;

    @Column({ comment: 'The name of contract.' })
    name: string;

    @Column({ comment: 'The symbol of contract.' })
    symbol: string;

    @Column({ comment: 'The base uri of contract.' })
    baseUri: string;

    @Column({ comment: 'The owner of contract.' })
    owner: string;

    @Column({ default: 1, comment: 'The chain id for the record.' })
    chainId?: number;

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;
}
