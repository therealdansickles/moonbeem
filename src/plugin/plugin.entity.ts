import { MetadataConfigs } from 'src/metadata/metadata.dto';
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { MetadataCondition, MetadataProperties } from '../metadata/metadata.entity';

class PluginMetadata {
    properties: MetadataProperties;
    conditions: MetadataCondition;
    configs: MetadataConfigs;
}

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

    @Column({ nullable: true, comment: 'The banner url of the plugin.' })
    readonly bannerUrl?: string;

    @Column({ nullable: true, comment: 'The version of the plugin.' })
    readonly version?: string;

    @Column({ nullable: true, comment: 'The author of the plugin.' })
    readonly author?: string;

    @Column({
        default: 'rule-engine',
        comment: 'The type of the plugin, can be `rule-engine` or `plugin`',
    })
    readonly type?: string;

    @Column({ 
        default: true,
        comment: 'The status of the plugin, should not display when `isPublished` equals to false'
    })
    readonly isPublished: boolean;

    @Column({
        default: {},
        type: 'jsonb',
        comment: 'Metadata template.'
    })
    readonly metadata: PluginMetadata;

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;
}
