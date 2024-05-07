const {
  RekognitionClient,
  SearchFacesByImageCommand,
} = require("@aws-sdk/client-rekognition");

const rekognitionClient = new RekognitionClient();

exports.handler = async (event, context) => {
  console.log("Verify Auth Challenge: " + JSON.stringify(event));
  let userPhoto = "";
  event.response.answerCorrect = false;

  // Searching existing faces indexed on Rekognition using the provided photo on s3

  const objectName = event.request.challengeAnswer;
  const searchCmd = new SearchFacesByImageCommand({
    CollectionId: process.env.COLLECTION_NAME,
    Image: {
      S3Object: {
        Bucket: process.env.BUCKET_SIGN_IN,
        Name: objectName,
      },
    },
    MaxFaces: 1,
    FaceMatchThreshold: 90,
    // QualityFilter: "AUTO",
  });
  try {
    const { FaceMatches } = await rekognitionClient.send(searchCmd);

    // Evaluates if Rekognition was able to find a match with the required
    // confidence threshold

    if (FaceMatches && FaceMatches[0]) {
      console.log("Face Id: " + FaceMatches[0].Face.FaceId);
      console.log("Similarity: " + FaceMatches[0].Similarity);
      userPhoto = FaceMatches[0].Face.FaceId;
      if (userPhoto) {
        if (event.request.privateChallengeParameters.answer == userPhoto) {
          event.response.answerCorrect = true;
        }
      }
    }
  } catch (err) {
    console.error(
      "Unable to query rekognition. Error:",
      JSON.stringify(err, null, 2)
    );
    throw err;
  }
  return event;
};
