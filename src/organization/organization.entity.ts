import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    OneToMany,
    ManyToMany,
    ManyToOne,
    RelationId,
    JoinColumn,
} from 'typeorm';
import { Collection } from '../collection/collection.entity';
import { Membership } from '../membership/membership.entity';
import { User } from '../user/user.entity';

export enum OrganizationKind {
    Personal,
    General,
}

@Entity({ name: 'Organization' })
export class Organization extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.ownedOrganizations)
    @JoinColumn()
    owner: User;

    @Column({ unique: true, comment: 'The unique URL-friendly name of the organization.' })
    name: string;

    @Column({ comment: 'The displayed name for the organization.' })
    displayName: string;

    @Column({
        type: 'enum',
        enum: OrganizationKind,
        default: OrganizationKind.General,
        comment:
            'The type of organization that this is. * `personal` - default organization with your account. * `general` - Bulk generation of NFTs.',
    })
    kind?: OrganizationKind;

    @Column({ nullable: true, comment: 'The description for the organization.' })
    about?: string;

    @Column({ nullable: true, comment: "The URL pointing to the organization's avatar." })
    avatarUrl?: string;

    @Column({ nullable: true, comment: "The URL pointing to the organization's background." })
    backgroundUrl?: string;

    @Column({ nullable: true, comment: "The url of the organization's website." })
    websiteUrl?: string;

    @Column({ nullable: true, comment: 'The twitter handle for the organization.' })
    twitter?: string;

    @Column({ nullable: true, comment: 'The instagram handle for the organization.' })
    instagram?: string;

    @Column({ nullable: true, comment: 'The discord handle for the organization.' })
    discord?: string;

    @ManyToOne(() => Membership, (membership) => membership.organization)
    memberships: Membership[];

    @OneToMany(() => Collection, (collection) => collection.organization)
    collections: Collection[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
