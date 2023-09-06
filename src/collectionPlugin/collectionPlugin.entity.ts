import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Collection } from '../collection/collection.entity';
import { Plugin } from '../plugin/plugin.entity';

type PluginDetail = any;

@Entity({ name: 'CollectionPlugin' })
export class CollectionPlugin extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ unique: true, comment: 'The name of the plugin.' })
    readonly name: string;

    @Column({ nullable: true, comment: 'The description of the plugin.' })
    readonly description?: string;

    @Column({ nullable: true, comment: 'The mediaUrl url of the plugin.' })
    readonly mediaUrl?: string;

    @Column({
        default: {},
        type: 'jsonb',
        comment: 'Recipient filters',
    })
    readonly pluginDetail: PluginDetail;

    @ManyToOne(() => Collection, (collection) => collection.plugins, {
        createForeignKeyConstraints: false,
    })
    readonly collection: Collection;

    @ManyToOne(() => Plugin, (plugin) => plugin.collectionPlugins, {
        createForeignKeyConstraints: false,
    })
    readonly plugin: Plugin;

    @Column({ nullable: true, comment: 'merkle root for the recipients' })
    readonly merkleRoot?: string;

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;
}
