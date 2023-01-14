import { Scalar, CustomScalar } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { GraphQLError, Kind, ValueNode } from 'graphql';

@Scalar('EthereumAddress')
export class EthereumAddress implements CustomScalar<string, String> {
    description = 'Ethereum Address custom scalar type';

    parseValue(value: string): String {
        if (ethers.utils.isAddress(value)) {
            return value.toLowerCase();
        }
        throw new GraphQLError(`EthereumAddress cannot represent a non ethereum address value: ${value}`);
    }

    serialize(value: String): string {
        return value.toLowerCase();
    }

    parseLiteral(ast: ValueNode): String {
        if (ast.kind === Kind.STRING) {
            return ast.value.toLowerCase();
        }
        return null;
    }
}
