import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

export enum ContractType {
    factory = 'factory',
    erc20 = 'erc20',
    erc721 = 'erc721',
    simpleFactory = 'simpleFactory',
    royaltyReceiver = 'royaltyReceiver',
    mintSale = 'mintSale',
    mintSaleMultiple = 'mintSaleMultiple',
    mintSaleWhitelisting = 'mintSaleWhitelisting',
    mintSaleMultipleWhitelisting = 'mintSaleMultipleWhitelisting',
    unknown = 'unknown',
}

@Entity({ name: 'Factory' })
export class Factory extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: 'Block height of transaction.' })
    height: number;

    @Column({ comment: 'Transaction hash of transaction.' })
    txHash: string;

    @Column({ comment: 'Transaction time of transaction.' })
    txTime: number;

    @Column({ comment: 'Transaction sender of transaction.' })
    sender: string;

    @Column({ comment: 'The contract address.' })
    address: string;

    @Column({ comment: 'The master contract address.' })
    masterAddress: string;

    @Column({
        type: 'enum',
        enum: ContractType,
        default: ContractType.unknown,
        comment: 'The type of Contract.',
    })
    kind: ContractType;

    @Column({ default: 1, comment: 'The chain id for the factory.' })
    chainId?: number;

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;
}
