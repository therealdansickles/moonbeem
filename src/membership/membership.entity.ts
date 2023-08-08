import * as jwt from 'jwt-simple';
import {
    BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne,
    PrimaryGeneratedColumn, UpdateDateColumn
} from 'typeorm';

import { lowercaseTransformer } from '../lib/transformer/lowercase.transformer';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';

@Entity({ name: 'Membership' })
@Index(['user.id', 'organization.id'], { unique: true })
@Index(['email', 'organization.id'], { unique: true })
export class Membership extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @ManyToOne(() => User, (user) => user.memberships, {
        eager: true,
        createForeignKeyConstraints: false,
        nullable: true,
    })
    @JoinColumn()
    public user?: User;

    @Column({ nullable: true, comment: 'The email of the invited user', transformer: lowercaseTransformer })
    public email?: string;

    @ManyToOne(() => Organization, (organization) => organization.membership, {
        eager: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    public organization: Organization;

    @Column({ nullable: true, comment: 'The invite code for the membership invite' })
    public inviteCode?: string;

    @Column({ default: false, comment: 'Can edit draft collections.' })
    readonly canEdit: boolean;

    @Column({ default: false, comment: 'Can manage the organization members.' })
    readonly canManage: boolean;

    @Column({ default: false, comment: 'Can deploy collections to the platform.' })
    readonly canDeploy: boolean;

    @Column({ nullable: true, comment: 'Date the user accepted the invite' })
    public acceptedAt: Date;

    @Column({ nullable: true, comment: 'Date the user declined the invite' })
    public declinedAt: Date;

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;

    @BeforeInsert()
    setInviteCode(): void {
        const payload = {
            email: this.email.toLowerCase(),
            organizationId: this.organization?.id,
            displayName: this.organization?.displayName,
            avatarUrl: this.organization?.avatarUrl,
            isNewUser: !this.user?.id,
        };
        this.inviteCode = jwt.encode(payload, process.env.INVITE_SECRET);
    }
}
