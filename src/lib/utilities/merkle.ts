import { solidityKeccak256, defaultAbiCoder, keccak256 } from 'ethers/lib/utils';
import { ethers } from 'ethers';

export function encodeTokenAddressAndIds(address: string, tokenIds: number[]) {
    return Buffer.from(
        solidityKeccak256(['address', 'uint256[]'], [address, tokenIds])
            .slice(2)
            .padStart(32 * 2, '0'),
        'hex'
    );
}

export function encodeAddressAndAmount(address: string, max: number) {
    return Buffer.from(
        solidityKeccak256(['address', 'uint256'], [address, max])
            .slice(2)
            .padStart(32 * 2, '0'),
        'hex'
    );
}

export function encodeTokenAccountAmount(accountAddress: string, tokenAddress: string, amount: number) {
    return keccak256(defaultAbiCoder.encode(['address', 'address', 'uint256'], [accountAddress, tokenAddress, amount]));
}

export function encodeAddressAndERC20AndAmount(address: string, erc20: string, amount: string) {
    const abiCoder = new ethers.utils.AbiCoder();
    return ethers.utils.keccak256(abiCoder.encode(['address', 'address', 'uint256'], [address, erc20, amount]));
}
