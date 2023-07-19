import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'Coin' })
export class Coin extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ comment: 'The coin address.' })
    readonly address: string;

    @Column({ comment: 'The name of coin.' })
    readonly name: string;

    @Column({ comment: 'The symbol of coin.' })
    readonly symbol: string;

    @Column({ comment: 'The decimals of coin.' })
    readonly decimals: number;

    @Column({ comment: 'Price of tokens converted to ETH. Required decimals are 18' })
    readonly derivedETH: string;

    @Column({ comment: 'Price of tokens converted to USDC. Required decimals are 18' })
    public derivedUSDC: string;

    @Column({ default: false, comment: 'Is this token address a native token' })
    readonly native: boolean;

    @Column({ default: true, comment: 'Whether this token is open for use' })
    readonly enable: boolean;

    @Column({ default: 1, comment: 'The chain id for the coin.' })
    readonly chainId?: number;

    @CreateDateColumn()
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
