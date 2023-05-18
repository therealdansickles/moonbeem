import { keccak256 } from 'ethers';
import { ethers } from 'ethers';

export function encodeTokenAddressAndIds(address: string, tokenIds: number[]) {
    return Buffer.from(
        ethers
            .solidityPackedKeccak256(['address', 'uint256[]'], [address, tokenIds])
            .slice(2)
            .padStart(32 * 2, '0'),
        'hex'
    );
}

export function encodeAddressAndAmount(address: string, max: number) {
    return Buffer.from(
        ethers
            .solidityPackedKeccak256(['address', 'uint256'], [address, max])
            .slice(2)
            .padStart(32 * 2, '0'),
        'hex'
    );
}

export function encodeTokenAccountAmount(accountAddress: string, tokenAddress: string, amount: number) {
    return keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'address', 'uint256'],
            [accountAddress, tokenAddress, amount]
        )
    );
}

export function encodeAddressAndERC20AndAmount(address: string, erc20: string, amount: string) {
    const abiCoder = new ethers.AbiCoder();
    return ethers.keccak256(abiCoder.encode(['address', 'address', 'uint256'], [address, erc20, amount]));
}
