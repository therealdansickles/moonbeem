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
