import { Module } from '@nestjs/common';
import { AWSAdapter } from '../lib/adapters/aws.adapter';
import { EthereumAddress } from '../lib/scalars/eth.scalar';

@Module({
    imports: [],
    controllers: [],
    providers: [AWSAdapter, EthereumAddress],
    exports: [AWSAdapter],
})
export class SharedModule {}
