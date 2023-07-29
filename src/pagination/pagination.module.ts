import { IEntity, IPaginatedType } from './pagination.interface';

export function PaginatedImp<T extends IEntity>(result: T[], total: number): IPaginatedType<T> {
    const hasPreviousPage = !!result;
    const hasNextPage = !!result;

    const edges = result.map((entity) => ({
        node: entity,
        cursor: toCursor(entity),
    }));

    return {
        edges: edges,
        pageInfo: {
            hasNextPage: hasNextPage,
            hasPreviousPage: hasPreviousPage,
            startCursor: edges[0]?.cursor,
            endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount: total,
    };
}

export function toCursor(value: IEntity): string {
    const createdAt = value.createdAt;
    const localOffset = createdAt.getTimezoneOffset() * 60 * 1000;
    const localTime = createdAt.getTime() - localOffset;

    const newCreatedAt = new Date(localTime);
    const cursor = Buffer.from(newCreatedAt.toISOString()).toString('base64');
    return cursor;
}

const CURSOR_SPLITTER = '::';

type Cursors = {
    startCursor: string;
    endCursor: string;
};
type CursorGenerator = (entity: IEntity) => string;

export function fromCursor(cursor: string): string {
    return Buffer.from(cursor, 'base64').toString();
}

/**
 * Function to convert an array of items to a paginated result
 * If you want to support more sort fields, you can expand the IEntity interface
 * @param items The items to be paginated, should contain at least one item
 * @param cursorGenerator The function to generate the cursor string from an item
 * @param total The total number of items
 */
export const toPaginated = <T extends IEntity>(
    items: T[],
    total: number,
    cursorGenerator: CursorGenerator = entityCursorGenerator
): IPaginatedType<T> => {
    return items.length > 0
        ? {
            edges: items.map((item) => ({ node: item })),
            pageInfo: {
                hasNextPage: !!items,
                hasPreviousPage: !!items,
                ...getCursors(items, cursorGenerator),
            },
            totalCount: total,
        }
        : {
            edges: [],
            pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
            },
            totalCount: total,
        };
};

/**
 * Function to get the cursors from an array of items
 * @param items The items to be paginated
 * @param cursorGenerator The function to generate the cursor string from an item
 */
export const getCursors = <T extends IEntity>(items: T[], cursorGenerator: CursorGenerator): Cursors => ({
    startCursor: cursorGenerator(items[0]),
    endCursor: cursorGenerator(items[items.length - 1]),
});

/**
 * Function to generate the cursor string from an entity
 * @param entity The entity to generate the cursor from
 */
export const entityCursorGenerator = (entity: IEntity): string => dateAndStringToCursor(entity.createdAt, entity.id);

/**
 * Function to compensate the timezone lost. It happens when get the UTC time but used as local time.
 * @param date The date to be converted
 */
export const toISODateWithTimezone = (date: Date): string => new Date(
    date.getTime() - date.getTimezoneOffset() * 60 * 1000).toISOString();

/**
 * Generate the cursor string from a Date and a string
 * @param date The date to be converted
 * @param string The string to be converted
 */
export const dateAndStringToCursor = (date: Date, string: string): string =>
    Buffer.from(`${toISODateWithTimezone(date)}${CURSOR_SPLITTER}${string}`).toString('base64');

/**
 * Convert a cursor back to a Date and a string
 * @param cursor The cursor to be converted
 */
export const cursorToStrings = (cursor: string): string[] =>
    Buffer.from(cursor, 'base64').toString().split(CURSOR_SPLITTER);
