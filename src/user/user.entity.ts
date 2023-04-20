import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
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

    @OneToMany(() => Wallet, (wallet) => wallet.owner)
    wallets: Wallet[];

    @OneToMany(() => Membership, (membership) => membership.user, { lazy: true })
    memberships: Membership[];

    //@ManyToOne(() => Organization, (organization) => organization.owner, { lazy: true })
    //@JoinColumn({ name: 'organizations' })
    //organizations: Organization[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
