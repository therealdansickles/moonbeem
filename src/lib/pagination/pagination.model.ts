import { Type } from '@nestjs/common';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { IEntity, IPaginatedType } from './pagination.interface';
import { IsArray, IsBoolean, IsObject, IsString } from 'class-validator';

@ObjectType('PageInfo')
export class PageInfo {
    @Field(() => Boolean, { description: 'Next page in the current paging results, Used to determine paging status' })
    @IsBoolean()
    readonly hasNextPage: boolean;

    @Field(() => Boolean, {
        description: 'Previous page in the current paging results, Used to determine paging status',
    })
    @IsBoolean()
    readonly hasPreviousPage: boolean;

    @Field(() => String, { nullable: true, description: 'Cursor value of the first item in the result set' })
    @IsString()
    readonly startCursor?: string;

    @Field(() => String, { nullable: true, description: 'Cursor value of the last item in the result set' })
    @IsString()
    readonly endCursor?: string;
}

export default function Paginated<T>(classRef: Type<T>) {
    @ObjectType(`${classRef.name}Edge`)
    abstract class EdgeType {
        @Field(() => String)
        readonly cursor: string;

        @Field(() => classRef)
        readonly node: T;
    }

    @ObjectType(`${classRef.name}Connection`)
    abstract class PaginatedType implements IPaginatedType<T> {
        @Field(() => [EdgeType], { nullable: true, description: 'Return the result set' })
        @IsArray()
        readonly edges: Array<EdgeType>;

        @Field(() => PageInfo, { description: 'Cursor-based paging information' })
        @IsObject()
        readonly pageInfo: PageInfo;

        @Field(() => Int, { description: 'Total number of entity objects in query' })
        readonly totalCount: number;
    }
    return PaginatedType;
}

export function PaginatedImp<T extends IEntity>(result: T[], total: number): IPaginatedType<T> {
    const hasPreviousPage = result ? true : false;
    const hasNextPage = result ? true : false;

    const edges = result.map((e) => ({
        node: e,
        cursor: toCursor(e),
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

export function fromCursor(cursor: string): string {
    const createdAt = Buffer.from(cursor, 'base64').toString();
    return createdAt;
}
