import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
} from "typeorm"

@Entity()
export class Update {
    @PrimaryGeneratedColumn('uuid')
    id: number

    @Column()
    addressCollection: string

    @Column()
    timeStamp: string

}