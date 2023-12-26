import boto3
from decimal import Decimal
import json
import urllib.parse
import urllib.request
from decimal import Decimal

print('Loading function')

rekognition = boto3.client('rekognition')
s3_client = boto3.client('s3')
sns = boto3.client('sns')

# BUCKET_NAME = 'londonfacerekognition'

sns_topic_arn = 'YOUR_SNS_TOPIC_ARN'


def send_notification(message):
    sns.publish(
        TopicArn=sns_topic_arn,
        Message=message,
        Subject='Notification from Serverless Face rekognition Lambda'
    )


def send_response_to_server(response):
    url = "YOUR_NODEJS_APP_URL" # if you are working local you can use ngrok to generate a public url to access your local node app
    headers = {"Content-Type": "application/json", "method":"POST"}
    # data = json.dumps(response).encode("utf-8")
    data = json.dumps(list(response)).encode("utf-8")


    req = urllib.request.Request(url, data, headers)
    with urllib.request.urlopen(req) as f:
        print(f.read().decode("utf-8"))
      
        
def detect_faces(bucket, key, fullname):
    """
    Detect faces in an image using Amazon Rekognition and store face details in DynamoDB.

    Args:
        bucket (str): The S3 bucket name.
        key (str): The key of the S3 object (image).

    Returns:
        dict: The response from the Rekognition API.
    """
    response = rekognition.detect_faces(Image={"S3Object": {"Bucket": bucket, "Name": key}})

    # Extract FaceDetails from the response
    source_faces = response.get('FaceDetails', [])

    # Check if FaceDetails array is empty
    if not source_faces:
        # Handle the case where no faces were detected in the source image
        error_message = "Details: No faces detected in the source image."
        send_notification(error_message)
        send_response_to_server({str(len(source_faces))})
        return ("No faces detected in the source image.")
        
    else:
        face_print_response = rekognition.index_faces(Image={"S3Object": {"Bucket": bucket, "Name": key}}, CollectionId="BLUEPRINT_COLLECTION")
        faceId = face_print_response['FaceRecords'][0]['Face']['FaceId']

            
        # # Store face details in DynamoDB
        table = boto3.resource('dynamodb').Table('faceRekognitionTable')
        # source_face = [{'RekognitionId': {'FaceId': face['FaceRecords'][0]['Face']['FaceId']}} for face in face_print_response] Metadata={'FullName':image[1]}
        table.put_item(Item={'id': key, 'FaceId': faceId, 'fullname': fullname})
        
        
        message = str(len(source_faces)) + " faces detected in the source image."
        # json.dumps(message).encode("utf-8")
        send_notification(message)
        send_response_to_server({str(len(source_faces))})
        

    return {"success": True, "number_of_faces": len(source_faces), "faceDetails": face_print_response}


def detect_labels(bucket, key):
    """
    Detect labels in an image using Amazon Rekognition and store label predictions in DynamoDB.

    Args:
        bucket (str): The S3 bucket name.
        key (str): The key of the S3 object (image).

    Returns:
        dict: The response from the Rekognition API.
    """
    response = rekognition.detect_labels(Image={"S3Object": {"Bucket": bucket, "Name": key}}, MinConfidence=80)

    # Store label predictions in DynamoDB
    table = boto3.resource('dynamodb').Table('faceRekognitionTable')
    labels = [{'Confidence': Decimal(str(label['Confidence'])), 'Name': label['Name']} for label in response['Labels']]
    table.put_item(Item={'id': key, 'Labels': labels})

    return response


def index_faces(bucket, key):
    """
    Index faces in an image using Amazon Rekognition.

    Args:
        bucket (str): The S3 bucket name.
        key (str): The key of the S3 object (image).

    Returns:
        dict: The response from the Rekognition API.
    """
    response = rekognition.index_faces(Image={"S3Object": {"Bucket": bucket, "Name": key}}, CollectionId="BLUEPRINT_COLLECTION")

    return response


def compare_faces(source_image, target_image, BUCKET_NAME):
    """
    Compare faces between two images using Amazon Rekognition.

    Args:
        source_image (str): The key of the source image in S3.
        target_image (str): The key of the target image in S3.

    Returns:
        list: A list of comparisons with confidence scores.
    """
    source_response = rekognition.detect_faces(Image={"S3Object": {"Bucket": BUCKET_NAME, "Name": source_image}})
    source_faces = source_response['FaceDetails']

    target_response = rekognition.detect_faces(Image={"S3Object": {"Bucket": BUCKET_NAME, "Name": target_image}})
    target_faces = target_response['FaceDetails']

    comparisons = []
    for source_face in source_faces:
        for target_face in target_faces:
            compare_response = rekognition.compare_faces(
                QualityFilter='AUTO',
                SimilarityThreshold=80.0,
                SourceImage={"S3Object": {"Bucket": BUCKET_NAME, "Name": source_image}},
                TargetImage={"S3Object": {"Bucket": BUCKET_NAME, "Name": target_image}}
            )

            if 'FaceMatches' in compare_response and compare_response['FaceMatches']:
                similarity_score = compare_response['FaceMatches'][0]['Similarity']
                comparisons.append({
                    'source_face_id': source_face,
                    'target_face_id': target_face,
                    'similarity': similarity_score,
                })
            else:
                comparisons.append({
                    'source_face_id': source_face,
                    'target_face_id': target_face,
                    'similarity': None,
                })

    return comparisons









def search_image_by_faces(image_binary):
    response = rekognition.search_faces_by_image(
        CollectionId='BLUEPRINT_COLLECTION',
        Image={'Bytes': image_binary}
    )

    found = False
    for match in response['FaceMatches']:
        print(match['Face']['FaceId'], match['Face']['Confidence'])

        face = dynamodb.get_item(
            TableName='faceRekognitionTable',
            Key={'RekognitionId': {'S': match['Face']['FaceId']}}
        )

        if 'Item' in face:
            print("Found Person: ", face['Item']['FullName']['S'])
            found = True

    if not found:
        print("Person cannot be recognized")





def lambda_handler(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name'] #'londonfacerekognition'
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    
    # fullname = event['Records'][0]['s3']['object']['metadata'].get('x-amz-meta-fullname')
    response = s3_client.head_object(Bucket=bucket, Key=key)
    metadata = response['Metadata']

    # Get fullname metadata
    fullname = metadata.get('fullname')

    try:
        # Calls rekognition DetectFaces API to detect faces in S3 object
        response = detect_faces(bucket, key, fullname)
    
    
        # Calls rekognition DetectLabels API to detect labels in S3 object
        #response = detect_labels(bucket, key)
    
    
        # Calls rekognition IndexFaces API to detect faces in S3 object and index faces into specified collection
        # response = index_faces(bucket, key)
        
            
        # Calls Rekognition compare_faces API to compare two or multiple faces in two images
        # source_image = urllib.parse.unquote_plus('IMG_4867.jpg')
        # target_image = urllib.parse.unquote_plus('IMG_4867.jpg')
        # response = compare_faces(source_image, target_image, bucket)
        
        return response
       
        
        

    except boto3.exceptions.Boto3Error as e:
        print(f"Boto3 error: {e}")
        raise e
    except ValueError as e:
        print(f"ValueError: {e}")
        raise e
    except Exception as e:
        print(e)
        print(f"Error processing object {key} from bucket {bucket}. "
              "Make sure your object and bucket exist and your bucket is in the same region as this function.")
        raise e
   
