import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export class MerkleData {
    address: string;
    amount: string;
}

@Entity({ name: 'MerkleTree' })
export class MerkleTree extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ unique: true, comment: 'The merkle root for the merkle tree.' })
    readonly merkleRoot: string;

    @Column({ type: 'jsonb', default: [], comment: 'The merkle data for the merkle tree.' })
    readonly data: MerkleData[];

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;
}
