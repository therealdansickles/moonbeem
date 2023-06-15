import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'Record721' })
export class Record721 extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ comment: 'Block height of transaction.' })
    readonly height: number;

    @Column({ comment: 'Transaction hash of transaction.' })
    readonly txHash: string;

    @Column({ comment: 'Transaction time of transaction.' })
    readonly txTime: number;

    @Column({ comment: 'The contract address.' })
    readonly address: string;

    @Column({ comment: 'The name of contract.' })
    readonly name: string;

    @Column({ comment: 'The symbol of contract.' })
    readonly symbol: string;

    @Column({ comment: 'The base uri of contract.' })
    readonly baseUri: string;

    @Column({ comment: 'The owner of contract.' })
    readonly owner: string;

    @Column({ default: 1, comment: 'The chain id for the record.' })
    readonly chainId?: number;

    @CreateDateColumn()
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
