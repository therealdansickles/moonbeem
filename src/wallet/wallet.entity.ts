import {
    BaseEntity,
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    RelationId,
    UpdateDateColumn,
} from 'typeorm';
import { Collection } from '../collection/collection.entity';
import { User } from '../user/user.entity';
import { Collaboration } from '../collaboration/collaboration.entity';
import { lowercaseTransformer } from '../lib/transformer/lowercase.transformer';

@Entity({ name: 'Wallet' })
export class Wallet extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        length: 64,
        unique: true,
        comment: 'The Ethereum address',
        transformer: lowercaseTransformer,
    })
    address: string;

    @OneToMany(() => Collection, (collection) => collection.creator)
    createdCollections?: Collection[];

    @OneToMany(() => Collaboration, (collaboration) => collaboration.wallet, { lazy: true })
    collaborations?: Collaboration[];

    // "The entity that owns the wallet. This can be reset by binding / unbinding. * The default uuid(blackhole) is for all unbound wallets. * the entity currently is a user. But this can change to an organization. * that's why there isn't a set relation here",
    @ManyToOne(() => User, (user) => user.wallets, { createForeignKeyConstraints: false })
    owner?: User;

    @Column({ unique: true, comment: 'The name for the wallet.' })
    name?: string;

    @Column({ nullable: true, comment: 'The url of the user\'s website. ' })
    readonly websiteUrl?: string;

    @Column({ nullable: true, comment: 'The URL pointing to the wallet\'s avatar.' })
    avatarUrl?: string;

    @Column({ nullable: true, comment: 'The description for the wallet.' })
    about?: string;

    @Column({ nullable: true, comment: 'The twitter handle for the wallet.' })
    twitter?: string;

    @Column({ nullable: true, comment: 'The instagram handle for the wallet.' })
    instagram?: string;

    @Column({ nullable: true, comment: 'The discord handle for the wallet.' })
    discord?: string;

    @Column({ nullable: true, comment: 'The spotify handle for the wallet.' })
    spotify?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
