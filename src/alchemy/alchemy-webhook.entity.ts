import { Exclude } from 'class-transformer';
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'AlchemyWebhook' })
export class AlchemyWebhook extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ comment: 'Type of the webhooks, can be `factory` for address activity or `token` for NFT activity' })
    readonly type: string;

    @Column({ unique: true, comment: 'The address of the contract need to be synced to Alchemy.' })
    readonly address: string;

    @Column({ nullable: true, comment: 'The network of the address belongs to' })
    readonly network?: string;

    @CreateDateColumn()
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
