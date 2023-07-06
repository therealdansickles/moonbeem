import {
    BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'Plugin' })
export class Plugin extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ unique: true, comment: 'The name of the plugin.' })
    readonly name: string;

    @Column({ comment: 'The display name of the plugin.' })
    readonly displayName: string;
    
    @Column({ nullable: true, comment: 'The description of the plugin.' })
    readonly description?: string;

    @Column({ nullable: true, comment: 'The version of the plugin.' })
    readonly version?: string;

    @Column({ nullable: true, comment: 'The author of the plugin.' })
    readonly author?: string;

    @Column({
        default: {},
        type: 'jsonb',
        comment: 'Metadata template.'
    })
    readonly metadata: string;

    @Column({ 
        default: true,
        comment: 'The status of the plugin, should not display when isPublish equals to false'
    })
    readonly isPublish: boolean;

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;
}
