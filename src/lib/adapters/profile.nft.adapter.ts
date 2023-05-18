import * as fs from 'fs';
import * as Sentry from '@sentry/node';
import { chainConfig as chain } from '../configs/db.config';
import { getAddress } from '@ethersproject/address';
import { Contract, JsonRpcProvider, Wallet, ethers, ContractTransactionReceipt, HDNodeWallet } from 'ethers';

export class ProfileNFTAdapter {
    private provider: JsonRpcProvider;
    public signer: HDNodeWallet | Wallet;
    private abi: string = '';
    public contract: Contract;

    constructor() {
        this.initAbi();
        this.provider = this.getProvider();
        this.signer = this.getWallet();
        this.contract = new ethers.Contract(chain.address, this.abi, this.signer);
    }

    private initAbi() {
        const nftMintSaleWhitelistingMultipleJson = 'src/lib/abi/NFTMintSaleWhitelisting.json';
        const f = fs.readFileSync(nftMintSaleWhitelistingMultipleJson);
        this.abi = JSON.stringify(JSON.parse(f.toString()), null, 2);
    }

    getProvider() {
        return new ethers.JsonRpcProvider(chain.rpc, { name: chain.name, chainId: chain.id });
    }

    getWallet() {
        try {
            const keystoreFilePath = 'keystore';
            const keystorePassword = chain.keystorePassword;
            const keystore = JSON.parse(fs.readFileSync(keystoreFilePath).toString());
            return ethers.Wallet.fromEncryptedJsonSync(JSON.stringify(keystore), keystorePassword).connect(
                this.provider
            );
            // return new ethers.Wallet(account.privateKey, this.provider);
        } catch (err) {
            Sentry.captureException(err);
            throw new Error(`Wallet initial err, msg: ${(err as Error).message}`);
        }
    }

    async buyNFT(address: string): Promise<ContractTransactionReceipt> {
        try {
            const tx = await this.contract.buyNFT(address);
            return tx.wait();
        } catch (err) {
            Sentry.captureException(err);
            throw new Error(`${address} buyNFT err, msg: ${(err as Error).message}`);
        }
    }

    async buyNFTMultiple(address: string, tier?: number): Promise<ContractTransactionReceipt> {
        try {
            const tx = await this.contract.buyNFT(address, tier ?? 0);
            return tx.wait();
        } catch (err) {
            Sentry.captureException(err);
            throw new Error(`${address} buyNFT err, msg: ${(err as Error).message}`);
        }
    }

    checksum(address: string) {
        try {
            return getAddress(address);
        } catch (err) {
            return null;
        }
    }
}
