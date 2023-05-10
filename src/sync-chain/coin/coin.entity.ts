import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'Coin' })
export class Coin extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: 'The coin address.' })
    address: string;

    @Column({ comment: 'The name of coin.' })
    name: string;

    @Column({ comment: 'The symbol of coin.' })
    symbol: string;

    @Column({ comment: 'The decimals of coin.' })
    decimals: number;

    @Column({ comment: 'Price of tokens converted to ETH. Required decimals are 18' })
    derivedETH: string;

    @Column({ comment: 'Price of tokens converted to USDC. Required decimals are 18' })
    derivedUSDC: string;

    @Column({ default: false, comment: 'Is this token address a native token' })
    native: boolean;

    @Column({ default: true, comment: 'Whether this token is open for use' })
    enable: boolean;

    @Column({ default: 1, comment: 'The chain id for the coin.' })
    chainId?: number;

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;
}
