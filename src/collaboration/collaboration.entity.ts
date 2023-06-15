import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Collection } from '../collection/collection.entity';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import { Wallet } from '../wallet/wallet.entity';
import { lowercaseTransformer } from '../lib/transformer/lowercase.transformer';

@Entity({ name: 'Collaboration' })
export class Collaboration extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ nullable: true, comment: 'The template name of this collaboration.' })
    readonly name?: string;

    @Column({
        nullable: true,
        length: 64,
        unique: true,
        comment: 'The Ethereum address',
        transformer: lowercaseTransformer,
    })
    readonly address?: string;

    @Column({ default: 100, comment: 'The royalty rate in percentage.' })
    readonly royaltyRate?: number;

    @OneToMany(() => Collection, (collection) => collection.collaboration, { createForeignKeyConstraints: false })
    readonly collections: Collection[];

    @ManyToOne(() => Organization, (organization) => organization.collaborations, {
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    public organization?: Organization;

    @ManyToOne(() => User, (user) => user.collaborations, { createForeignKeyConstraints: false })
    @JoinColumn()
    public user?: User;

    @ManyToOne(() => Wallet, (wallet) => wallet.collaborations, { createForeignKeyConstraints: false })
    @JoinColumn()
    public wallet?: Wallet;

    @Column({ comment: 'All collaborators of this collaboration', type: 'jsonb', default: [] })
    readonly collaborators?: Collaborator[];

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;
}

export class Collaborator {
    role: string;
    name: string;
    address: string;
    rate: number;
}
