const AWS = require('aws-sdk');
const Jimp = require('jimp');
const jsQR = require('jsqr');
const { pdfToCairo } = require('pdf-poppler');
const path = require('path');
const fs = require('fs');
const util = require('util');

const s3 = new AWS.S3();
const writeFileAsync = util.promisify(fs.writeFile);
const unlinkAsync = util.promisify(fs.unlink);

console.log('Loading function');

exports.handler = async (event) => {
    console.log("Received event: ", JSON.stringify(event, null, 2));

    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const tempFilePath = `/tmp/${path.basename(key)}`;
    const fileExt = path.extname(key).toLowerCase();

    console.log(`File to analyze: ${key}`);

    try {
        const objectData = await s3.getObject({ Bucket: bucket, Key: key }).promise();
        await writeFileAsync(tempFilePath, objectData.Body);

        if (fileExt === '.pdf') {
            // Convert first page of PDF to image
            const outputFilePath = await convertPdfToImage(tempFilePath);
            await processImage(outputFilePath, bucket, path.dirname(key));
            await unlinkAsync(outputFilePath);
        } else if (['.jpg', '.jpeg', '.png'].includes(fileExt)) {
            await processImage(tempFilePath, bucket, path.dirname(key));
        }

        await unlinkAsync(tempFilePath);
    } catch (e) {
        console.error(e);
        throw e;
    }
};

async function convertPdfToImage(pdfPath) {
    const outputFilePath = path.join('/tmp', 'temp.jpg');
    await pdfToCairo(pdfPath, {
        format: 'jpeg',
        out_dir: '/tmp',
        out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
        page: 1 // convert only the first page
    });
    return outputFilePath;
}

async function processImage(imagePath, bucket, keyPrefix) {
    const image = await Jimp.read(imagePath);
    const qrCode = findQRCodeInImage(image);

    if (qrCode) {
        console.log(`Found QR code: ${qrCode.data}`);
        const cropped = image.crop(qrCode.location.topLeftCorner.x, qrCode.location.topLeftCorner.y, qrCode.location.dimension.x, qrCode.location.dimension.y);
        const buffer = await cropped.getBufferAsync(Jimp.MIME_JPEG);
        const s3Key = `${keyPrefix}/qr.jpg`;
        await uploadToS3(bucket, s3Key, buffer);
        console.log(`QR code image uploaded to ${s3Key}`);
    } else {
        console.log("No QR code detected");
    }
}

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

async function uploadToS3(bucket, key, buffer) {
    await s3.putObject({
        Bucket: bucket,
        Key: `VerificacionDeOpinionDeCumplimiento/CodigoQRExtraido/qrextraido__${Date.now()}.pdf`,
        Body: buffer,
        ContentType: 'image/jpeg'
    }).promise();
}
