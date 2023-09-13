export interface IPageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
}

export interface IEdgeType<T> {
    cursor?: string;
    node: T;
}

export interface IPaginatedType<T> {
    edges: IEdgeType<T>[];
    pageInfo: IPageInfo;
    totalCount: number;
}

export interface IEntity {
    id: string;
    createdAt: Date;
    quantity: number;
    address: string;
    txHash: string;
}
