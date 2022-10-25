import AWS from "aws-sdk";
import stream from "stream";

class S3 {
    s3: AWS.S3;

    connect = async () => {
        // Connect to S3
        this.s3 = await new AWS.S3({ apiVersion: "2022-10-01" });

        // Create S3 buckets
        const makeBucket = async (bucketName) =>
            await this.s3
                .createBucket({
                    Bucket: bucketName,
                })
                .promise()
                .catch((e) => {
                    if (e.code == "BucketAlreadyOwnedByYou") return;
                    console.log(e);
                });

        makeBucket(process.env.S3_BUCKET_NAME_CLIPS);
        makeBucket(process.env.S3_BUCKET_NAME_MERGED);
    };

    uploadStream = async (slug, readStream) => {
        const writeStream = new stream.PassThrough();
        readStream.pipe(writeStream);

        await this.s3
            .upload({
                Bucket: process.env.S3_BUCKET_NAME_CLIPS,
                Key: slug,
                Body: writeStream,
            })
            .promise();
    };

    keyExists = async (bucket, key) => {
        try {
            await this.s3
                .headObject({
                    Bucket: bucket,
                    Key: key,
                })
                .promise();

            return true;
        } catch (e) {
            return false;
        }
    };

    getFile = async (bucket, key) => {
        try {
            const result = await this.s3
                .getObject({
                    Bucket: bucket,
                    Key: key,
                })
                .promise();

            return result.Body;
        } catch (e) {
            return null;
        }
    };

    streamFile = (bucket, key) => {
        return this.s3
            .getObject({
                Bucket: bucket,
                Key: key,
            })
            .createReadStream();
    };

    clipExists = async (slug) =>
        this.keyExists(process.env.S3_BUCKET_NAME_CLIPS, slug);

    mergedVideoExists = async (mergedName) =>
        this.keyExists(process.env.S3_BUCKET_NAME_MERGED, mergedName);

    getClip = async (slug) =>
        this.getFile(process.env.S3_BUCKET_NAME_CLIPS, slug);

    getMergedVideo = async (mergedName) =>
        this.getFile(process.env.S3_BUCKET_NAME_MERGED, mergedName);

    streamMergedVideo = (mergedName) =>
        this.streamFile(process.env.S3_BUCKET_NAME_MERGED, mergedName);
}

const s3 = new S3();

export default s3;
