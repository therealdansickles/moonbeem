import { generateSlug } from './collection.utils';

describe('CollectionService', () => {
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
