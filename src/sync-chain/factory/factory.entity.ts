import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
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
    airdrop = 'airdrop',
    unknown = 'unknown',
    migration = 'migration',
}

@Entity({ name: 'Factory' })
export class Factory extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ comment: 'Block height of transaction.' })
    readonly height: number;

    @Column({ comment: 'Transaction hash of transaction.' })
    readonly txHash: string;

    @Column({ comment: 'Transaction time of transaction.' })
    readonly txTime: number;

    @Column({ comment: 'Transaction sender of transaction.' })
    readonly sender: string;

    @Column({ comment: 'The contract address.' })
    readonly address: string;

    @Column({ comment: 'The master contract address.' })
    readonly masterAddress: string;

    @Column({
        type: 'enum',
        enum: ContractType,
        default: ContractType.unknown,
        comment: 'The type of Contract.',
    })
    readonly kind: ContractType;

    @Column({ default: 1, comment: 'The chain id for the factory.' })
    readonly chainId?: number;

    @CreateDateColumn({
        precision: 3,
    })
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
