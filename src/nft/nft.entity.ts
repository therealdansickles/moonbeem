import { Exclude } from 'class-transformer';
import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Collection } from '../collection/collection.entity';
import { MetadataProperties } from '../metadata/metadata.entity';
import { Tier } from '../tier/tier.entity';

@Entity({ name: 'Nft' })
@Index(['collection.id', 'tier.id', 'tokenId'], { unique: true })
export class Nft extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @ManyToOne(() => Collection, (collection) => collection.nfts, {
        eager: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    @Index()
    public collection: Collection;

    @ManyToOne(() => Tier, (tier) => tier.nfts, {
        eager: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    @Index()
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

    @Column({ nullable: true, comment: 'The owner address of the NFT.' })
    readonly ownerAddress: string;

    @Column({ nullable: true })
    readonly image: string;

    // @Column({
    //     default: {}
    // })
    // readonly metadataConfig: { [key: string]: string };
    @Column({ default: '', comment: 'The Erc6551 account.' })
    readonly account: string;

    @CreateDateColumn()
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
