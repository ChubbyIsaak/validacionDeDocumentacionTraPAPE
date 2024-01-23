const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const textract = new AWS.Textract();

const bucketName = 'YOUR_S3_BUCKET'; // Replace with your S3 bucket name
const documentKeys = ['documentKey1', 'documentKey2']; // Replace with your document keys
const outputFileName = 'comparison_results.txt';

async function getTextFromDocument(bucket, key) {
    const params = {
        Document: { S3Object: { Bucket: bucket, Name: key } },
        FeatureTypes: ["FORMS"]
    };
    const result = await textract.analyzeDocument(params).promise();
    return result.Blocks.filter(block => block.BlockType === "LINE").map(line => line.Text).join('\n');
}

function extractInformation(text) {
    const folioMatch = text.match(/Folio\s*([\w\d]+)/i);
    const rfcMatch = text.match(/RFC\s*([\w\d]+)/i);
    const fechaMatch = text.match(/Fecha\s*([\w\d\s-]+)/i);
    const sentidoMatch = text.match(/Sentido\s*([\w\d]+)/i);

    return {
        folio: folioMatch ? folioMatch[1] : null,
        rfc: rfcMatch ? rfcMatch[1] : null,
        fecha: fechaMatch ? fechaMatch[1] : null,
        sentido: sentidoMatch ? sentidoMatch[1] : null
    };
}

function compareInformation(info1, info2) {
    return {
        folioMatch: info1.folio === info2.folio,
        rfcMatch: info1.rfc === info2.rfc,
        fechaMatch: info1.fecha === info2.fecha,
        sentidoMatch: info1.sentido === info2.sentido
    };
}

async function uploadTextToS3(text) {
    const params = {
        Bucket: bucketName,
        Key: outputFileName,
        Body: text
    };
    await s3.putObject(params).promise();
}

exports.handler = async () => {
    const text1 = await getTextFromDocument(bucketName, documentKeys[0]);
    const text2 = await getTextFromDocument(bucketName, documentKeys[1]);

    const info1 = extractInformation(text1);
    const info2 = extractInformation(text2);
    const comparison = compareInformation(info1, info2);

    const outputText = `Comparison Results:\n${JSON.stringify(comparison, null, 2)}\nProcessed on: ${new Date().toISOString()}`;
    await uploadTextToS3(outputText);

    return { statusCode: 200, body: JSON.stringify(comparison) };
};
