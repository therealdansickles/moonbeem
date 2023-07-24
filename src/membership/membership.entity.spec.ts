import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Membership } from './membership.entity';

describe('MembershipService', () => {
    let repository: Repository<Membership>;

    beforeAll(async () => {
        repository = global.membershipRepository;
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
