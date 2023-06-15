import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

import { Membership } from './membership.entity';
import { MembershipModule } from './membership.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';

describe('MembershipService', () => {
    let repository: Repository<Membership>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                MembershipModule,
                OrganizationModule,
                UserModule,
            ],
        }).compile();

        repository = module.get('MembershipRepository');
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    it('should lower case the email', async () => {
        let membership = new Membership();
        membership.email = faker.internet.email().toUpperCase();
        await repository.insert(membership);
        membership = await repository.findOneBy({ email: membership.email.toLowerCase() });
        expect(membership.email).toBe(membership.email.toLowerCase());
    });

    it('should set the invite code', async () => {
        let membership = new Membership();
        membership.email = faker.internet.email();
        await repository.insert(membership);
        membership = await repository.findOneBy({ email: membership.email.toLowerCase() });
        expect(membership.inviteCode).toBeDefined();
    });
});
