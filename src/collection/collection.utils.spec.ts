import { filterTokenIdsByRanges, generateSlug, generateTokenIdsByRanges } from './collection.utils';

describe('CollectionServiceUtil', () => {
    describe('generateSlug', function () {
        it('should lowercase the name', () => {
            expect(generateSlug('Vibe')).toEqual('vibe');
        });

        it('should replace spaces with dashes', () => {
            expect(generateSlug('he llo wor ld')).toEqual('he-llo-wor-ld');
        });

        it('should remove non-alphanumeric characters', () => {
            expect(generateSlug('&*()he!llo@wo$rld;#')).toEqual('helloworld');
        });
    });

    describe('generateTokenIdsByRanges', () => {
        it('should generate empty array if ranges is empty', function () {
            const result = generateTokenIdsByRanges([]);
            expect(result).toEqual([]);
        });

        it('should generate tokenIds by ranges', () => {
            const result = generateTokenIdsByRanges([
                [1, 5],
                [7, 10],
            ]);
            expect(result).toEqual(['1', '2', '3', '4', '5', '7', '8', '9', '10']);
        });
    });

    describe('filterTokenIdsByRanges', () => {
        it('should return empty array if the tokenIds is out of ranges', function () {
            const result = filterTokenIdsByRanges(['1', '2', '3', '4', '5', '7', '8', '9', '10'], [[11, 20]]);
            expect(result).toEqual([]);
        });

        it('should return filtered tokenIds', () => {
            const result = filterTokenIdsByRanges(
                ['1', '2', '3', '4', '5', '7', '8', '9', '10'],
                [
                    [3, 8],
                    [10, 10],
                ]
            );
            expect(result).toEqual(['3', '4', '5', '7', '8', '10']);
        });
    });
});
