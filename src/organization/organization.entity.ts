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
import { Collaboration } from '../collaboration/collaboration.entity';
import { Collection } from '../collection/collection.entity';
import { Membership } from '../membership/membership.entity';
import { User } from '../user/user.entity';

// see https://stackoverflow.com/questions/55598213/enums-not-working-with-nestjs-and-graphql
export enum OrganizationKind {
    personal = 'personal',
    general = 'general',
}

@Entity({ name: 'Organization' })
export class Organization extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @ManyToOne(() => User, (user) => user.ownedOrganizations, { eager: true })
    @JoinColumn()
    public owner: User;

    @Column({ unique: true, comment: 'The unique URL-friendly name of the organization.' })
    readonly name: string;

    @Column({ comment: 'The displayed name for the organization.' })
    readonly displayName: string;

    @Column({
        default: OrganizationKind.general,
        comment:
            'The type of organization that this is. * `personal` - default organization with your account. * `general` - Bulk generation of NFTs.',
    })
    readonly kind?: string;

    @Column({ nullable: true, comment: 'The description for the organization.' })
    readonly about?: string;

    @Column({ nullable: true, comment: "The URL pointing to the organization's avatar." })
    readonly avatarUrl?: string;

    @Column({ nullable: true, comment: "The URL pointing to the organization's background." })
    readonly backgroundUrl?: string;

    @Column({ nullable: true, comment: "The url of the organization's website." })
    readonly websiteUrl?: string;

    @Column({ nullable: true, comment: 'The twitter handle for the organization.' })
    readonly twitter?: string;

    @Column({ nullable: true, comment: 'The instagram handle for the organization.' })
    readonly instagram?: string;

    @Column({ nullable: true, comment: 'The discord handle for the organization.' })
    readonly discord?: string;

    @OneToMany(() => Membership, (membership) => membership.organization)
    readonly membership: Membership[];

    @OneToMany(() => Collection, (collection) => collection.organization)
    readonly collections: Collection[];

    @OneToMany(() => Collaboration, (collaboration) => collaboration.organization)
    readonly collaborations: Collaboration[];

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;
}
