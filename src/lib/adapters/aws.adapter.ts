import S3 from 'aws-sdk/clients/s3.js';
import CloudFront from 'aws-sdk/clients/cloudfront.js';
import { randomString } from '../utils.js';

export enum ResourceType {
    Metadata = 'metadata',
    Media = 'media',
    Other = 'other',
}

export class AWSAdapter {
    private s3: S3;
    private cf: CloudFront;
    private bucket: string;
    private metadataUri: string;
    private mediaUri: string;
    private baseUri: string;

    constructor() {
        // Verify that AccessKeyId or SecretAccessKey is provided
        let accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        let bucket = process.env.AWS_S3_BUCKET_NAME;
        let region = process.env.AWS_REGION ? process.env.AWS_REGION : 'us-east-1';
        let metadataBaseuri = process.env.AWS_METADATA_BASE_URI;
        let mediaBaseUri = process.env.AWS_IMAGE_BASE_URI;
        let baseUri = process.env.AWS_BASE_URL;

        if (!accessKeyId || !secretAccessKey || !bucket) console.log('Please provide AWS AccessKeyId or SecretAccessKey or bucket');
        if (!metadataBaseuri || !mediaBaseUri || !baseUri) console.log('Please provide the metadata baseuri or media baseuri or baseuri');

        // Create s3 object
        this.bucket = bucket ? bucket : '';
        this.metadataUri = metadataBaseuri && metadataBaseuri.endsWith('/') ? metadataBaseuri : metadataBaseuri + '/';
        this.mediaUri = mediaBaseUri && mediaBaseUri.endsWith('/') ? mediaBaseUri : mediaBaseUri + '/';
        this.baseUri = baseUri && baseUri.endsWith('/') ? baseUri : baseUri + '/';
        this.s3 = new S3({ region: region, accessKeyId: accessKeyId, secretAccessKey: secretAccessKey });
        this.cf = new CloudFront({ region: region, accessKeyId: accessKeyId, secretAccessKey: secretAccessKey });
    }

    async s3PutData(data: Buffer, fileName: string, resourceType?: ResourceType, contentType?: string): Promise<string> {
        let url = '';
        switch (resourceType) {
            case ResourceType.Metadata:
                url = this.metadataUri + fileName;
                fileName = `${ResourceType.Metadata}/${fileName}`;
                if (!contentType) contentType = 'application/json';
                break;
            case ResourceType.Media:
                url = this.mediaUri + fileName;
                fileName = `${ResourceType.Media}/${fileName}`;
                if (!contentType) contentType = 'image/jpeg';
                break;
            default:
                url = this.baseUri + fileName;
                fileName = fileName;
                if (!contentType) contentType = 'application/octet-stream';
        }

        const succ = await this.s3PutData_(data, fileName, contentType);

        return succ ? url : '';
    }

    async s3PutData_(data: Buffer, fileName: string, contentType: string) {
        try {
            const param: S3.PutObjectRequest = {
                Body: data,
                Bucket: this.bucket,
                Key: fileName,
                ContentType: contentType,
                CacheControl: 'public, max-age=86400', // default cache control
            };

            await this.s3.putObject(param).promise();
            return true;
        } catch (err) {
            console.log(`s3PutData_ err, data length[${data.length}], fileName[${fileName}], contentType[${contentType}], msg: ${(err as Error).message}`);
            return false;
        }
    }

    async refreshCDN() {
        const id = process.env.AWS_CLOUDFRONT_ID;
        if (!id) return;

        const param: CloudFront.CreateInvalidationRequest = {
            DistributionId: id,
            InvalidationBatch: { Paths: { Quantity: 1, Items: ['/*'] }, CallerReference: getCallerReference() },
        };
        await this.cf.createInvalidation(param).promise();
    }
}

function getCallerReference(): string {
    const date_time = Math.floor(Date.now() / 1000);
    const _random = randomString(8);
    return `vibe-server-${date_time}-${_random.toLowerCase()}`;
}
