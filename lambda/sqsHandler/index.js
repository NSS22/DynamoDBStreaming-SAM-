const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();
const s3Client = new AWS.S3({ region: 'eu-west-1' });
const dynamoDBItems = [];

exports.processSQSMessages = async (event) => {
    const listenerTableName = process.env.LISTENER_DYNAMODB_TABLE_NAME;

    try {
        const s3Items = event.Records.flatMap(({ body }) => {
            const { Records } = JSON.parse(body);

            return Records.map((record) => ({
                Bucket: record.s3.bucket.name,
                Key: record.s3.object.key
            }));
        });

        for (const { Bucket, Key } of s3Items) {
            const { Body } = await s3Client.getObject({
                Bucket,
                Key,
                ResponseContentType: 'application/json'
            }).promise();

            dynamoDBItems.push({
                PutRequest: {
                    Item: JSON.parse(Body.toString())
                }
            });
        }

        await documentClient.batchWrite({
            RequestItems: {
                [listenerTableName]: dynamoDBItems
            }
        }).promise();
    } catch (error) {
        console.log(`Error: ${JSON.stringify(error)}`);
    }
};
