import { cursorToStrings, dateAndStringToCursor, stringsToCursor, toPaginated } from './pagination.utils';
import { faker } from '@faker-js/faker';

describe('Pagination', function () {
    describe('pagination utils', function () {
        it('should convert [] to paginated list', () => {
            const result = toPaginated([], 100);
            expect(result).toEqual({
                edges: [],
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
                totalCount: 100,
            });
        });

        it('should convert data array to paginated list', () => {
            const past = faker.date.past();
            const future = faker.date.future();
            const items = [
                { id: '1', createdAt: past },
                { id: '2', createdAt: future },
            ];
            const result = toPaginated(items, 100);
            expect(result).toEqual({
                edges: [
                    { node: { id: '1', createdAt: past }, cursor: dateAndStringToCursor(past, '1') },
                    { node: { id: '2', createdAt: future }, cursor: dateAndStringToCursor(future, '2') },
                ],
                pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: dateAndStringToCursor(past, '1'),
                    endCursor: dateAndStringToCursor(future, '2'),
                },
                totalCount: 100,
            });
        });

        it('should convert string array to cursor and can convert back', () => {
            const address = faker.finance.ethereumAddress();
            const cursor = stringsToCursor('1', address);
            expect(cursor).toBeDefined();
            const [id, addressFromCursor] = cursorToStrings(cursor);
            expect(id).toEqual('1');
            expect(addressFromCursor).toEqual(address);
        });
    });
});
