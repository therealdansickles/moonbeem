import {
    BaseEntity,
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';

@Entity({ name: 'Membership' })
@Index(['user.id', 'organization.id'], { unique: true })
@Index(['email', 'organization.id'], { unique: true })
export class Membership extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.memberships, {
        eager: true,
        createForeignKeyConstraints: false,
        nullable: true,
    })
    @JoinColumn()
    user?: User;

    @Column({ nullable: true, comment: 'The email of the invited user' })
    email?: string;

    @ManyToOne(() => Organization, (organization) => organization.membership, {
        eager: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    organization: Organization;

    @Column({ nullable: true, comment: 'The invite code for the membership invite' })
    inviteCode?: string;

    @Column({ default: false, comment: 'Can edit draft collections.' })
    canEdit: boolean;

    @Column({ default: false, comment: 'Can manage the organization members.' })
    canManage: boolean;

    @Column({ default: false, comment: 'Can deploy collections to the platform.' })
    canDeploy: boolean;

    @Column({ nullable: true, comment: 'Date the user accepted the invite' })
    acceptedAt: Date;

    @Column({ nullable: true, comment: 'Date the user declined the invite' })
    declinedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @BeforeInsert()
    async setInviteCode(): Promise<void> {
        if (!this.inviteCode) {
            this.inviteCode = Math.random().toString(36).substring(2, 15);
        }
    }

    @BeforeInsert()
    @BeforeUpdate()
    async lowercaseEmail(): Promise<void> {
        if (this.email) {
            this.email = this.email.toLowerCase();
        }
    }
}
