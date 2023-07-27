import { hashSync as hashPassword } from 'bcryptjs';
import {
    BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';

import { Collaboration } from '../collaboration/collaboration.entity';
import { lowercaseTransformer } from '../lib/transformer/lowercase.transformer';
import { Membership } from '../membership/membership.entity';
import { Organization } from '../organization/organization.entity';
import { Wallet } from '../wallet/wallet.entity';

@Entity({ name: 'User' })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ nullable: true, comment: 'The username of the user.' })
    readonly username?: string;

    @Column({ unique: true, comment: 'The email of the user.', transformer: lowercaseTransformer })
    public email: string;

    @Column({ nullable: true, comment: 'The google mail address of the user.', transformer: lowercaseTransformer })
    public gmail?: string;

    @Column({ nullable: true, comment: 'The verification token of the user.' })
    public verificationToken?: string;

    @Column({ nullable: true, comment: 'The hashed password of the user.' })
    public password?: string;

    @Column({ nullable: false, default: 'local', comment: 'The provider used to create the account.' })
    public provider: string;

    @Column({ nullable: true, comment: 'The name for the user.' })
    readonly name?: string;

    @Column({ nullable: true, comment: "The URL pointing to the user's avatar." })
    readonly avatarUrl?: string;

    @Column({ nullable: true, comment: 'The description for the user.' })
    readonly about?: string;

    @Column({ nullable: true, comment: "The URL pointing to the user's background." })
    readonly backgroundUrl?: string;

    @Column({ nullable: true, comment: "The url of the user's website." })
    readonly websiteUrl?: string;

    @Column({ nullable: true, comment: 'The twitter handle for the user.' })
    readonly twitter?: string;

    @Column({ nullable: true, comment: 'The instagram handle for the user.' })
    readonly instagram?: string;

    @Column({ nullable: true, comment: 'The discord handle for the user.' })
    readonly discord?: string;

    @OneToMany(() => Wallet, (wallet) => wallet.owner, { eager: true })
    readonly wallets: Wallet[];

    @OneToMany(() => Membership, (membership) => membership.user, { lazy: true })
    readonly memberships: Membership[];

    @OneToMany(() => Organization, (organization) => organization.owner)
    readonly ownedOrganizations: Organization[];

    @OneToMany(() => Collaboration, (collaboration) => collaboration.user)
    readonly collaborations: Collaboration[];

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;

    @Column({ nullable: true, comment: 'The verified at time.' })
    readonly verifiedAt: Date;

    /**
     * Hashes the password and generate token before inserting it into the database.
     */
    @BeforeInsert()
    async beforeInsertActions() {
        this.verificationToken = await Math.random().toString(36).substring(2);

        if (this.password) {
            this.password = hashPassword(this.password, 10);
        }
    }
}
