import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    OneToMany,
    ManyToOne,
    RelationId,
    JoinColumn,
} from 'typeorm';
import { Collection } from '../collection/collection.entity';
import { User } from '../user/user.entity';
import { Collaboration } from '../collaboration/collaboration.entity';
import { Field } from '@nestjs/graphql';

@Entity({ name: 'Wallet' })
export class Wallet extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 64, unique: true, comment: 'The Ethereum address' })
    address: string;

    //@OneToMany(() => Collection, (collection) => collection.creator, { lazy: true })
    //createdCollections?: Collection[];

    @OneToMany(() => Collaboration, (collaboration) => collaboration.wallet, { lazy: true })
    collaborations?: Collaboration[];

    // "The entity that owns the wallet. This can be reset by binding / unbinding. * The default uuid(blackhole) is for all unbound wallets. * the entity currently is a user. But this can change to an organization. * that's why there isn't a set relation here",
    @ManyToOne(() => User, (user) => user.wallets)
    @Field(() => User, { nullable: true })
    owner?: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
