const AWS = require('aws-sdk');
const Jimp = require('jimp');
const jsQR = require('jsqr');
const s3 = new AWS.S3();

const bucketName = 'trapape-s3'; // Replace with your bucket name
const sourceFolder = 'DocumentosAProcesar/VerificacionDeOpinionDeCumplimiento/CodigoQRExtraido/';
const destinationFolder = 'DocumentosAProcesar/VerificacionDeOpinionDeCumplimiento/OpinionDeCumplimiento/'; // Replace with your destination folder
const maxFileSize = 1 * 1024 * 1024; // 1 MB

exports.handler = async () => {
    const objects = await s3.listObjectsV2({ Bucket: bucketName, Prefix: sourceFolder }).promise();
    const imageKeys = objects.Contents.filter(obj => /\.(jpg|jpeg|png)$/i.test(obj.Key) && obj.Size <= maxFileSize).map(obj => obj.Key);

    let webAddresses = [];

    for (const key of imageKeys) {
        const object = await s3.getObject({ Bucket: bucketName, Key: key }).promise();
        const image = await Jimp.read(object.Body);
        const qrCode = findQRCodeInImage(image);

        if (qrCode) {
            webAddresses.push(qrCode.data);
        }
    }

    if (webAddresses.length > 0) {
        const outputFile = webAddresses.join('\n');
        await s3.putObject({ Bucket: bucketName, Key: destinationFolder + 'web_addresses.txt', Body: outputFile }).promise();
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Process completed', webAddresses }) };
};

function findQRCodeInImage(image) {
    const qrCodeImageData = new Uint8ClampedArray(image.bitmap.width * image.bitmap.height * 4);
    let i = 0;
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        qrCodeImageData[i++] = this.bitmap.data[idx + 0];
        qrCodeImageData[i++] = this.bitmap.data[idx + 1];
        qrCodeImageData[i++] = this.bitmap.data[idx + 2];
        qrCodeImageData[i++] = this.bitmap.data[idx + 3];
    });
    return jsQR(qrCodeImageData, image.bitmap.width, image.bitmap.height);
}
