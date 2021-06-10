const AWS = require('aws-sdk');

const s3Client = new AWS.S3({ region: 'eu-west-1' });

exports.processDynamoDBStream = async (event) => {
    try {
        const bucket = process.env.S3_BUCKET_NAME;
        const key = process.env.S3_BUCKET_KEY;
        const params = {
            Bucket: bucket,
            Key: key,
        };

        for (const record of event.Records) {
            const dynamoDBNewImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);

            await s3Client.putObject({
                ...params,
                Body: JSON.stringify(dynamoDBNewImage),
                ContentType: 'application/json',
            }).promise();
        }
    } catch (error) {
        console.log(`S3 put object to bucket error: ${JSON.stringify(error)}`);
    }
};
