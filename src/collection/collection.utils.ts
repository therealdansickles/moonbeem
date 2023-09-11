/**
 * Generate a slug from a name
 * - Lowercase
 * - Replace spaces with dashes
 * - Remove non-alphanumeric characters
 * @param name The name to generate a slug from
 */
export const generateSlug = (name: string) =>
    name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

/**
 * Generate token ids by ranges.
 * The range should be in the format of [start, end] and the start should be less than the end.
 * The start and end should be positive integers.
 * @param ranges The ranges to generate token ids
 * @private
 */
export const generateTokenIdsByRanges = (ranges: number[][]): string[] =>
    ranges
        .map((range) => {
            const [start, end] = range;
            if (start > end || start < 0 || end < 0) {
                throw new Error(`Invalid range`);
            }
            return Array.from({ length: end - start + 1 }, (_, i) => i + start);
        })
        .flat()
        .map((tokenId) => tokenId.toString());

export const filterTokenIdsByRanges = (tokenIds: string[], ranges: number[][]): string[] => {
    return tokenIds.filter((tokenId) =>
        ranges.find((range) => {
            const [start, end] = range;
            const value = parseInt(tokenId);
            return start <= value && value <= end;
        })
    );
};
