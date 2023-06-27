import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Collection } from '../collection/collection.entity';
import { Exclude } from 'class-transformer';
import { Tier } from '../tier/tier.entity';

export class Property {
    name: string;
    type: string;
    value: any;
    display_value: string;
}

export class Properties {
    [key: string]: Property
}

@Entity({ name: 'Nft' })
export class Nft extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @ManyToOne(() => Collection, (collection) => collection.nfts, {
        eager: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    readonly collection: Collection;

    @ManyToOne(() => Tier, (tier) => tier.nfts, {
        eager: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    readonly tier?: Tier;

    @Column('int')
    readonly tokenId: number;

    @Column({
        default: {},
        type: 'jsonb',
        nullable: true,
        comment: 'Metadata properties for the NFT.',
    })
    readonly properties: Properties;

    @CreateDateColumn()
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
