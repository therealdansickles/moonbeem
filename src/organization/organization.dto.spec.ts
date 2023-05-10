import { Organization } from './organization.dto';

describe('Organization', () => {
    it('should be defined', () => {
        expect(new Organization()).toBeDefined();
    });
});
