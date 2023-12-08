import json
import boto3
import os
import uuid
import base64
import pathlib
import datatier

from configparser import ConfigParser
from pypdf import PdfReader

def lambda_handler(event, context):
  try:
    print("**STARTING**")
    print("**lambda: parrot_pdf_to_text**")
    
    #
    # setup AWS based on config file:
    #
    config_file = 'config.ini'
    os.environ['AWS_SHARED_CREDENTIALS_FILE'] = config_file
    
    configur = ConfigParser()
    configur.read(config_file)
    
    #
    # configure for S3 access:
    #
    s3_profile = 's3readwrite'
    boto3.setup_default_session(profile_name=s3_profile)
    
    bucketname = configur.get('s3', 'bucket_name')
    
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucketname)
    
    #
    # configure for RDS access
    #
    rds_endpoint = configur.get('rds', 'endpoint')
    rds_portnum = int(configur.get('rds', 'port_number'))
    rds_username = configur.get('rds', 'user_name')
    rds_pwd = configur.get('rds', 'user_pwd')
    rds_dbname = configur.get('rds', 'db_name')
  
    #
    # the user has sent us two parameters:
    #  1. filename of their file
    #  2. raw file data in base64 encoded string
    #
    # The parameters are coming through web server 
    # (or API Gateway) in the body of the request
    # in JSON format.
    #
    print("**Accessing request body**")
 
    if "body" not in event:
      raise Exception("event has no body")
      
    body = json.loads(event["body"]) # parse the json
    
    if "filename" not in body:
      raise Exception("event has a body but no filename")
    if "data" not in body:
      raise Exception("event has a body but no data")

    filename = body["filename"]
    datastr = body["data"]
    
    print("filename:", filename)
    print("datastr (first 10 chars):", datastr[0:10])
    
    #
    # open connection to the database:
    #
    print("**Opening connection**")
    
    dbConn = datatier.get_dbConn(rds_endpoint, rds_portnum, rds_username, rds_pwd, rds_dbname)
    
    #
    # at this point the user exists, so safe to upload to S3:
    #
    bytes = base64.b64decode(datastr) # base64 bytes -> raw bytes
    
    #
    # write raw bytes to local filesystem for upload:
    #
    print("**Writing local data file**")
    
    local_filename = "/tmp/data.pdf"
    
    outfile = open(local_filename, "wb")
    outfile.write(bytes)
    outfile.close()
    
    
    #
    # add a jobs record to the database BEFORE we upload, just in case
    # the compute function is triggered faster than we can update the
    # database:
    #
    
    reader = PdfReader(local_filename)
    all_text = ""
    for page in reader.pages:
        text = page.extract_text()
        text = text.replace("\n", " ")
        all_text += f"{text} "


        print("**Adding jobs row to database**")
    
    sql = """
      INSERT INTO jobs(status, pdfname, txtkey)
                  VALUES('pending', %s, %s);
    """
    random_uuid = str(uuid.uuid4())
    txtkey = "parrot/" + filename + "/" + random_uuid + ".txt"
    datatier.perform_action(dbConn, sql, [filename, txtkey])

    # get the job ID
    sql = "SELECT LAST_INSERT_ID();"
    row = datatier.retrieve_one_row(dbConn, sql)
    jobid = row[0]

    # write txt
    temptxt = "/tmp/output.txt"
    outfile = open(temptxt, "w")
    outfile.write(f"{all_text}\n")
    outfile.close()

    bucket.upload_file(temptxt,
                       txtkey,
                       ExtraArgs={
                         'ACL': 'public-read',
                         'ContentType': 'text/plain'
                       })
                       
    print(f"**Finished uploading stuff, text is now at {txtkey}**")
    
    return {
      'statusCode': 200,
      'body': {
        'jobid': json.dumps(str(jobid)),
        'textkey': txtkey,
        'body': all_text,
        'headers': {
          'Access-Control-Allow-Origin': '*', # Or specify your origin e.g. 'https://yourdomain.com'
          'Access-Control-Allow-Credentials': True,
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        }
      }
    }
    
  except Exception as err:
    print("**ERROR**")
    print(str(err))
    
    return {
      'statusCode': 400,
      'body': json.dumps(str(err))
    }