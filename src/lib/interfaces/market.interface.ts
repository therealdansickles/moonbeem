import { IsEthereumAddress } from "class-validator";

export class AddressHoldingReqDto {
    @IsEthereumAddress()
    readonly address: string;
}
