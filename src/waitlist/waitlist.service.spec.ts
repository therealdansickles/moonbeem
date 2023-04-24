import { Repository } from 'typeorm';
import { Waitlist } from './waitlist.entity';
import { WaitlistService } from './waitlist.service';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from '../lib/configs/db.config';
import { WaitlistModule } from './waitlist.module';
import { faker } from '@faker-js/faker';

describe('CollectionService', () => {
    let repository: Repository<Waitlist>;
    let service: WaitlistService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: postgresConfig.host,
                    port: postgresConfig.port,
                    username: postgresConfig.username,
                    password: postgresConfig.password,
                    database: postgresConfig.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                WaitlistModule,
            ],
        }).compile();

        repository = module.get('WaitlistRepository');
        service = module.get<WaitlistService>(WaitlistService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Waitlist" CASCADE');
    });

    describe('getWaitlist', () => {
        it('should get a waitlist item by email', async () => {
            const waitlist = await repository.save({
                email: faker.internet.email(),
                address: faker.finance.ethereumAddress(),
            });

            const result = await service.getWaitlist(waitlist.email);
            expect(result.id).toBeDefined();
        });
    });

    describe('createWaitlist', () => {
        it('should create a collection', async () => {
            const email = faker.internet.email();
            const address = faker.finance.ethereumAddress();
            const twitter = `@${faker.name.firstName()}`;

            const waitlist = await service.createWaitlist({
                email,
                address,
                twitter,
            });

            expect(waitlist).toBeDefined();
            expect(waitlist.email).toEqual(email);
            expect(waitlist.address).toEqual(address);
            expect(waitlist.twitter).toEqual(twitter);
        });
    });
});
