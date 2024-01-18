
import boto3
from PIL import Image, ImageDraw
import io
import os

def detect_qr_code(rekognition_client, image_bytes):
    """
    Detects QR codes in an image using AWS Rekognition.
    Args:
        rekognition_client: The Rekognition client.
        image_bytes (bytes): Byte array of the image.
    Returns:
        list: List of detected QR code bounding boxes.
    """
    response = rekognition_client.detect_text(Image={'Bytes': image_bytes})
    qr_codes = [text['Geometry']['BoundingBox'] for text in response['TextDetections'] if text['Type'] == 'QR_CODE']
    return qr_codes

def save_qr_code_as_jpg(image_bytes, qr_boxes):
    """
    Extracts QR code regions from an image and saves them as JPG.
    Args:
        image_bytes (bytes): Byte array of the original image.
        qr_boxes (list): List of bounding boxes for QR codes.
    Returns:
        list: List of byte arrays of the QR code images.
    """
    with Image.open(io.BytesIO(image_bytes)) as img:
        qr_images = []
        for box in qr_boxes:
            width, height = img.size
            left = int(box['Left'] * width)
            top = int(box['Top'] * height)
            qr_width = int(box['Width'] * width)
            qr_height = int(box['Height'] * height)

            qr_img = img.crop((left, top, left + qr_width, top + qr_height))
            qr_img_byte_arr = io.BytesIO()
            qr_img.save(qr_img_byte_arr, format='JPEG')
            qr_images.append(qr_img_byte_arr.getvalue())

        return qr_images

def upload_to_s3(s3_client, bucket_name, qr_images):
    """
    Uploads QR code images to an S3 bucket.
    Args:
        s3_client: The S3 client.
        bucket_name (str): The name of the S3 bucket.
        qr_images (list): List of byte arrays of QR code images.
    """
    for i, img_bytes in enumerate(qr_images):
        s3_client.put_object(Bucket=bucket_name, Key=f'qr_code_{i}.jpg', Body=img_bytes)

# Example Lambda handler function
def lambda_handler(event, context):
    # Setup AWS clients
    rekognition_client = boto3.client('rekognition')
    s3_client = boto3.client('s3')

    # Example image retrieval from S3 (adjust as needed)
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    print("Received event: ", event)
    response = s3_client.get_object(Bucket=bucket_name, Key=key)
    image_bytes = response['Body'].read()

    # Detect QR codes
    qr_boxes = detect_qr_code(rekognition_client, image_bytes)

    # Save QR codes as JPG
    qr_images = save_qr_code_as_jpg(image_bytes, qr_boxes)

    # Upload to S3
    upload_to_s3(s3_client, bucket_name, qr_images)

    return {
        'statusCode': 200,
        'body': 'Process completed successfully'
    }

    # Upload to S3
def upload_to_s3(s3_client, bucket_name, qr_images):
    for i, img_bytes in enumerate(qr_images):
        try:
            s3_client.put_object(Bucket=bucket_name, Key=f'qr_code_{i}.jpg', Body=img_bytes)
            print(f"Uploaded qr_code_{i}.jpg to {bucket_name}")
        except Exception as e:
            print(f"Error uploading to S3: {str(e)}")

    return {
        'statusCode': 200,
        'body': 'Process completed successfully'
    }
