import { ethers, keccak256 } from 'ethers';
import { MerkleTree } from 'merkletreejs';

const typeToSolidityTypes = {
    allowlist: {
        address: 'address',
        amount: 'uint256',
    },
    recipients: {
        tokenId: 'uint256',
        quantity: 'uint256',
    },
};

export const isValidType = (type: string) => typeToSolidityTypes[type] !== undefined;

export const generateMerkleRoot = (type: string, data: object[], sort: boolean = true): MerkleTree => {
    const leaves = data.map((item) => encodeLeafData(type, item));
    return new MerkleTree(leaves, keccak256, { sort });
};

export const encodeLeafData = (type: string, leaveData: object) => {
    const solidityType = typeToSolidityTypes[type];
    const keys = Object.keys(solidityType);
    const solidityTypes = keys.map((key) => solidityType[key]);
    const values = keys.map((key) => leaveData[key]);
    return encodeDataWithTypes(solidityTypes, values);
};

export const encodeDataWithTypes = (solidityTypes: string[], data: any[]) => {
    return Buffer.from(
        ethers
            .solidityPackedKeccak256(solidityTypes, data)
            .slice(2)
            .padStart(32 * 2, '0'),
        'hex'
    );
};

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
    return keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address', 'address', 'uint256'], [accountAddress, tokenAddress, amount]));
}

export function encodeAddressAndERC20AndAmount(address: string, erc20: string, amount: string) {
    const abiCoder = new ethers.AbiCoder();
    return ethers.keccak256(abiCoder.encode(['address', 'address', 'uint256'], [address, erc20, amount]));
}
