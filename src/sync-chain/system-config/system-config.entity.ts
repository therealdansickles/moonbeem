import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'SystemConfig' })
export class SystemConfig extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ comment: 'Config name.' })
    readonly name: string;

    @Column({ comment: 'Config value.' })
    readonly value: string;

    @Column({ comment: 'Type of config value. int64/string/int128' })
    readonly kind: string;

    @Column({ default: '', comment: 'Config comment.' })
    readonly comment?: string;

    @Column({ default: 1, comment: 'The chain id for the config.' })
    readonly chainId?: number;

    @CreateDateColumn({
        precision: 3
    })
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
