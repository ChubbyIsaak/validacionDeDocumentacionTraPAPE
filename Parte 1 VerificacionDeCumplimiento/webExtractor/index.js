const AWS = require('aws-sdk');
const fs = require('fs').promises;
const puppeteer = require('puppeteer-core');
const { addExtra } = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const s3 = new AWS.S3();
const bucketName = 'trapape-s3'; // Replace with your S3 bucket name

exports.handler = async (event) => {
    const { key } = event;
    const urlFile = await s3.getObject({ Bucket: bucketName, Key: key }).promise();
    const webAddress = urlFile.Body.toString('utf-8').trim();

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--headless', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.goto(webAddress, { waitUntil: 'networkidle2' });
    const pdfBuffer = await page.pdf({ format: 'A4' });

    await s3.putObject({
        Bucket: bucketName,
        Key: `OpinionDeCumplimiento/qrextraido__${Date.now()}.pdf`,
        Body: pdfBuffer
    }).promise();

    await browser.close();
};

const puppeteerExtra = addExtra(puppeteer);
puppeteerExtra.use(StealthPlugin());
