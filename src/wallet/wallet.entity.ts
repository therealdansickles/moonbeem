import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Collection } from '../collection/collection.entity';
import { User } from '../user/user.entity';
import { Collaboration } from '../collaboration/collaboration.entity';
import { lowercaseTransformer } from '../lib/transformer/lowercase.transformer';
import { Relationship } from '../relationship/relationship.entity';

@Entity({ name: 'Wallet' })
export class Wallet extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({
        length: 64,
        unique: true,
        comment: 'The Ethereum address',
        transformer: lowercaseTransformer,
    })
    public address: string;

    @OneToMany(() => Collection, (collection) => collection.creator)
    readonly createdCollections?: Collection[];

    @OneToMany(() => Collaboration, (collaboration) => collaboration.wallet, { lazy: true })
    readonly collaborations?: Collaboration[];

    // "The entity that owns the wallet. This can be reset by binding / unbinding. * The default uuid(blackhole) is for all unbound wallets. * the entity currently is a user. But this can change to an organization. * that's why there isn't a set relation here",
    @ManyToOne(() => User, (user) => user.wallets, { createForeignKeyConstraints: false })
    public owner?: User;

    @Column({ unique: true, comment: 'The name for the wallet.' })
    public name?: string;

    @OneToMany(() => Relationship, (relationship) => relationship.follower)
    readonly followers?: Relationship[];

    @OneToMany(() => Relationship, (relationship) => relationship.following)
    readonly followings?: Relationship[];

    @Column({ nullable: true, comment: "The url of the user's website. " })
    readonly websiteUrl?: string;

    @Column({ nullable: true, comment: "The URL pointing to the wallet's avatar." })
    readonly avatarUrl?: string;

    @Column({ nullable: true, comment: 'The description for the wallet.' })
    readonly about?: string;

    @Column({ nullable: true, comment: 'The twitter handle for the wallet.' })
    readonly twitter?: string;

    @Column({ nullable: true, comment: 'The instagram handle for the wallet.' })
    readonly instagram?: string;

    @Column({ nullable: true, comment: 'The discord handle for the wallet.' })
    readonly discord?: string;

    @Column({ nullable: true, comment: 'The spotify handle for the wallet.' })
    readonly spotify?: string;

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;
}
