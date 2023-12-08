import json
import boto3
import os
from tempfile import NamedTemporaryFile
import datatier
from configparser import ConfigParser

def lambda_handler(event, context):
    try:
        print("**STARTING**")
        print("**lambda: parrot_text_to_audio**")

        # # Extracting the bucket and key from the event
        # s3_event = event['Records'][0]['s3']
        # bucketname = s3_event['bucket']['name']
        if "body" not in event:
            raise Exception("event has no body")
      
        body = json.loads(event["body"]) # parse the json
        
        if "txtkey" not in body:
          raise Exception("event has a body but no txtkey")
       
        txtkey = body["txtkey"]


        # Setup AWS based on config file
        config_file = 'config.ini'
        os.environ['AWS_SHARED_CREDENTIALS_FILE'] = config_file

        configur = ConfigParser()
        configur.read(config_file)

        # Configure for S3 access
        s3_profile = 's3readwrite'
        bucketname = configur.get('s3', 'bucket_name')
        boto3.setup_default_session(profile_name=s3_profile)
        polly = boto3.client('polly', region_name='us-east-2')

        s3 = boto3.resource('s3')
        s3_client = boto3.client('s3')  # Add this line to create an S3 client
        bucket = s3.Bucket(bucketname)

        # Configure for RDS access
        rds_endpoint = configur.get('rds', 'endpoint')
        rds_portnum = int(configur.get('rds', 'port_number'))
        rds_username = configur.get('rds', 'user_name')
        rds_pwd = configur.get('rds', 'user_pwd')
        rds_dbname = configur.get('rds', 'db_name')

        # Get text file content from S3
        response = s3_client.get_object(Bucket=bucketname, Key=txtkey)
        text_file_content = response['Body'].read().decode('utf-8')

        # Convert text to speech using Amazon Polly
        response = polly.synthesize_speech(
            Text=text_file_content,
            OutputFormat='mp3',
            VoiceId='Joanna'
        )

        # Generate a temporary file to store the audio content
        with NamedTemporaryFile(delete=False) as temp_audio_file:
            temp_audio_file.write(response['AudioStream'].read())

        # Upload the audio file to S3
        bucketkey_audiofile = txtkey[0:-4] + ".mp3"
        print("**UPLOADING to S3 file", bucketkey_audiofile, "**")

        bucket.upload_file(temp_audio_file.name,
                           bucketkey_audiofile,
                           ExtraArgs={
                               'ACL': 'public-read',
                               'ContentType': 'audio/m'
                           })

        # Update the database to change the status of this job and store the results bucketkey
        dbConn = datatier.get_dbConn(rds_endpoint, rds_portnum, rds_username, rds_pwd, rds_dbname)
        sql = "UPDATE jobs SET status = 'completed', audiokey = %s WHERE txtkey = %s"
        datatier.perform_action(dbConn, sql, [bucketkey_audiofile, txtkey])

        # Done! Respond in an HTTP-like way, i.e., with a status code and body in JSON format
        print("**DONE, returning success**")
        return {
            'statusCode': 200,
            'audiokey': bucketkey_audiofile,
            'body': json.dumps("success")
        }

    except Exception as err:
        print("**ERROR**")
        print(str(err))

        # Update jobs row in the database
        dbConn = datatier.get_dbConn(rds_endpoint, rds_portnum, rds_username, rds_pwd, rds_dbname)
        sql = "UPDATE jobs SET status = 'error' WHERE txtkey = %s"
        datatier.perform_action(dbConn, sql, [txtkey])

        # Done, return
        return {
            'statusCode': 400,
            'body': json.dumps(str(err))
        }
