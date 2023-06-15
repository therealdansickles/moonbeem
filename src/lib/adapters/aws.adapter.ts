import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { randomString } from '../utils';

export enum ResourceType {
    Metadata = 'metadata',
    Media = 'media',
    Other = 'other',
}

export class AWSAdapter {
    private s3: S3Client;
    // private cf: CloudFront;
    private bucket: string;
    private _metadataUri: string;
    private _mediaUri: string;
    private _baseUri: string;

    constructor() {
        // Verify that AccessKeyId or SecretAccessKey is provided
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const bucket = process.env.AWS_S3_BUCKET_NAME;
        const region = process.env.AWS_REGION ? process.env.AWS_REGION : 'us-east-1';
        const metadataBaseuri = process.env.AWS_METADATA_BASE_URI;
        const mediaBaseUri = process.env.AWS_IMAGE_BASE_URI;
        const baseUri = process.env.AWS_BASE_URL;

        if (!accessKeyId || !secretAccessKey || !bucket)
            console.log('Please provide AWS AccessKeyId or SecretAccessKey or bucket');
        if (!metadataBaseuri || !mediaBaseUri || !baseUri)
            console.log('Please provide the metadata baseuri or media baseuri or baseuri');

        // Create s3 object
        this.bucket = bucket ? bucket : '';
        this._metadataUri = metadataBaseuri && metadataBaseuri.endsWith('/') ? metadataBaseuri : metadataBaseuri + '/';
        this._mediaUri = mediaBaseUri && mediaBaseUri.endsWith('/') ? mediaBaseUri : mediaBaseUri + '/';
        this._baseUri = baseUri && baseUri.endsWith('/') ? baseUri : baseUri + '/';
        this.s3 = new S3Client({ region: region, credentials: { accessKeyId, secretAccessKey } });
        // this.cf = new CloudFront({ region: region, accessKeyId: accessKeyId, secretAccessKey: secretAccessKey });
    }

    get baseUri() {
        return this._baseUri;
    }

    get mediaUri() {
        return this._mediaUri;
    }

    get metadataUri() {
        return this._metadataUri;
    }

    async s3PutData(
        data: Buffer,
        fileName: string,
        resourceType?: ResourceType,
        contentType?: string
    ): Promise<string> {
        let url = '';
        switch (resourceType) {
            case ResourceType.Metadata:
                url = this._metadataUri + fileName;
                fileName = `${ResourceType.Metadata}/${fileName}`;
                if (!contentType) contentType = 'application/json';
                break;
            case ResourceType.Media:
                url = this._mediaUri + fileName;
                fileName = `${ResourceType.Media}/${fileName}`;
                if (!contentType) contentType = 'image/jpeg';
                break;
            default:
                url = this._baseUri + fileName;
                if (!contentType) contentType = 'application/octet-stream';
        }

        const succ = await this.putData(data, fileName, contentType);

        return succ ? url : '';
    }

    /**
     * upload implementation for @aws-sdk/s3-client
     * @param data
     * @param fileName
     * @param contentType
     * @returns
     */
    private async putData(data: Buffer, fileName: string, contentType: string) {
        try {
            const param: PutObjectCommandInput = {
                Body: data,
                Bucket: this.bucket,
                Key: fileName,
                ContentType: contentType,
                CacheControl: 'public, max-age=86400', // default cache control
            };
            const command = new PutObjectCommand(param);
            await this.s3.send(command);
            return true;
        } catch (err) {
            console.log(
                `putData err, data length[${data.length}], fileName[${fileName}], contentType[${contentType}], msg: ${
                    (err as Error).message
                }`
            );
            return false;
        }
    }

    /**
     * DEPRECATED
     * legacy upload implementation for s3 client @ 2.x.y
     * @deprecated
     * @param data
     * @param fileName
     * @param contentType
     * @returns
     */
    // async s3PutData_(data: Buffer, fileName: string, contentType: string) {
    //     try {
    //         const param: S3.PutObjectRequest = {
    //             Body: data,
    //             Bucket: this.bucket,
    //             Key: fileName,
    //             ContentType: contentType,
    //             CacheControl: 'public, max-age=86400', // default cache control
    //         };

    //         await this.s3.putObject(param).promise();
    //         return true;
    //     } catch (err) {
    //         console.log(
    //             `s3PutData_ err, data length[${data.length
    //             }], fileName[${fileName}], contentType[${contentType}], msg: ${(err as Error).message}`
    //         );
    //         return false;
    //     }
    // }

    // as didn't find any reference for this function
    // commented first for migration to @aws-sdk/s3-client
    // async refreshCDN() {
    //     const id = process.env.AWS_CLOUDFRONT_ID;
    //     if (!id) return;

    //     const param: CloudFront.CreateInvalidationRequest = {
    //         DistributionId: id,
    //         InvalidationBatch: { Paths: { Quantity: 1, Items: ['/*'] }, CallerReference: getCallerReference() },
    //     };
    //     await this.cf.createInvalidation(param).promise();
    // }
}

export function getCallerReference(): string {
    const date_time = Math.floor(Date.now() / 1000);
    const _random = randomString(8);
    return `vibe-server-${date_time}-${_random.toLowerCase()}`;
}
