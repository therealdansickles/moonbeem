import { Exclude } from 'class-transformer';
import {
    BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';

import { Collection } from '../collection/collection.entity';
import { MetadataProperties } from '../metadata/metadata.entity';
import { Tier } from '../tier/tier.entity';

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

    @Column({ comment: 'The NFT tokenId' })
    readonly tokenId: string;

    @Column({
        default: {},
        type: 'jsonb',
        nullable: true,
        comment: 'Metadata properties for the NFT.',
    })
    readonly properties: MetadataProperties;

    // @Column({
    //     default: {}
    // })
    // readonly metadataConfig: { [key: string]: string };

    @CreateDateColumn()
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
