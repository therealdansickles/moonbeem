export interface IGraphQLRequest {
    headers: any;
    body: {
        query: string;
        variables?: any;
    };
}
