const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event, context) => {
  console.log("Create auth challenge: " + JSON.stringify(event));

  if (event.request.challengeName == "CUSTOM_CHALLENGE") {
    event.response.publicChallengeParameters = {};

    // Querying for Rekognition ids for the e-mail provided
    const query = new QueryCommand({
      TableName: process.env.COLLECTION_NAME,
      IndexName: "FullName-index",
      ProjectionExpression: "RekognitionId",
      KeyConditionExpression: "FullName = :userId",
      ExpressionAttributeValues: {
        ":userId": event.request.userAttributes.email,
      },
    });

    try {
      const { Items } = await ddbDocClient.send(query);
      Items.forEach((item) => {
        event.response.publicChallengeParameters.captchaUrl =
          item.RekognitionId;
        event.response.privateChallengeParameters = {};
        event.response.privateChallengeParameters.answer = item.RekognitionId;
        event.response.challengeMetadata = "REKOGNITION_CHALLENGE";

        console.log("Create Challenge Output: " + JSON.stringify(event));
      });
    } catch (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      throw err;
    }
  }
  return event;
};
