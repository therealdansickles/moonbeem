import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Collection } from '../collection/collection.entity';

@Entity({ name: 'Redeem' })
@Index(['collection.id', 'tokenId'], { unique: true })
export class Redeem extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @ManyToOne(() => Collection, (collection) => collection.redeems, {
        eager: true,
    })
    @JoinColumn()
    readonly collection: Collection;

    @Column({ type: 'bigint', comment: 'TokenId of the collection for redeeming.' })
    readonly tokenId: number;

    @Column({ comment: 'The wallet address for redeeming.' })
    readonly address: string;

    @Column({ nullable: true, comment: 'The full name of the redemption client.' })
    readonly name?: string;

    @Column({ nullable: true, comment: 'The delivery address for redeeming.' })
    readonly deliveryAddress?: string;

    @Column({ nullable: true, comment: 'The delivery city for redeeming.' })
    readonly deliveryCity?: string;

    @Column({ nullable: true, comment: 'The delivery zipcode for redeeming.' })
    readonly deliveryZipcode?: string;

    @Column({ nullable: true, comment: 'The delivery state for redeeming.' })
    readonly deliveryState?: string;

    @Column({ nullable: true, comment: 'The delivery country for redeeming.' })
    readonly deliveryCountry?: string;

    @Column({ nullable: true, comment: 'The delivery phone for redeeming.' })
    readonly deliveryPhone?: string;

    @Column({ nullable: true, comment: 'The email address for redeeming.' })
    readonly email: string;

    @Column({ default: false, comment: 'The state of the redeeming.' })
    readonly isRedeemed: boolean;

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;
}
