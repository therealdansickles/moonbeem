import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Wallet } from '../wallet/wallet.entity';
import { Membership } from '../membership/membership.entity';
import { Organization } from '../organization/organization.entity';

@Entity({ name: 'User' })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true, comment: 'The username of the user.' })
    username?: string;

    @Column({ unique: true, comment: 'The email of the user.' })
    email: string;

    @Column({ comment: 'The hashed password of the user.' })
    password?: string;

    @Column({ nullable: true, comment: 'The name for the user.' })
    name?: string;

    @Column({ nullable: true, comment: "The URL pointing to the user's avatar." })
    avatarUrl?: string;

    @Column({ nullable: true, comment: 'The description for the user.' })
    about?: string;

    @Column({ nullable: true, comment: "The URL pointing to the user's background." })
    backgroundUrl?: string;

    @Column({ nullable: true, comment: "The url of the user's website." })
    websiteUrl?: string;

    @Column({ nullable: true, comment: 'The twitter handle for the user.' })
    twitter?: string;

    @Column({ nullable: true, comment: 'The instagram handle for the user.' })
    instagram?: string;

    @Column({ nullable: true, comment: 'The discord handle for the user.' })
    discord?: string;

    @OneToMany(() => Wallet, (wallet) => wallet.owner, { eager: true })
    wallets: Wallet[];

    @OneToMany(() => Membership, (membership) => membership.user, { lazy: true })
    memberships: Membership[];

    @OneToMany(() => Organization, (organization) => organization.owner)
    ownedOrganizations: Organization[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
