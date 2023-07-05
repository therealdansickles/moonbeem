import {
    BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne,
    PrimaryGeneratedColumn, UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'Plugin' })
export class Plugin extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ comment: 'The name of the plugin.' })
    readonly name: string;
    
    @Column({ nullable: true, comment: 'The description of the plugin.' })
    readonly description: string;

    @Column({ nullable: true, comment: 'The version of the plugin.' })
    readonly version: string;

    @Column({ nullable: true, comment: 'The author of the plugin.' })
    readonly author: string;

    @Column({ default: {},
        type: 'jsonb',
        comment: 'Metadata template.',
        nullable: true
    })
    readonly metadata: string;

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;
}
