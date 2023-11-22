import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';


@Entity({ name: 'Referral' })
@Index(['referralCode'])
export class Referral extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ comment: 'The referral code.' })
    readonly referralCode: string;

    @Column({ comment: 'The collection id.' })
    readonly collectionId: string;

    @Column({ comment: 'The token id.' })
    readonly tokenId: string;

    @CreateDateColumn()
    readonly createdAt: Date;
}
