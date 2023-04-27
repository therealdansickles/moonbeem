import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'SystemConfig' })
export class SystemConfig extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: 'Config name.' })
    name: string;

    @Column({ comment: 'Config value.' })
    value: string;

    @Column({ comment: 'Type of config value. int64/string/int128' })
    kind: string;

    @Column({ default: '', comment: 'Config comment.' })
    comment?: string;

    @Column({ default: 1, comment: 'The chain id for the config.' })
    chainId?: number;

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;
}
