import json
import boto3
import os
import base64
import datatier

from configparser import ConfigParser

def lambda_handler(event, context):
  try:
    print("**STARTING**")
    print("**lambda: parrot_download**")

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
    s3_profile = 's3readonly'
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
    
    if "jobid" in event:
      jobid = event["jobid"]
    elif "pathParameters" in event:
      if "jobid" in event["pathParameters"]:
        jobid = event["pathParameters"]["jobid"]
      else:
        raise Exception("requires jobid parameter in pathParameters")
    else:
        raise Exception("requires jobid parameter in event")
        
    print("jobid:", jobid)

    #
    # does the audiokey exist?  What's the status of the job if so?
    #
    # open connection to the database:
    #
    print("**Opening connection**")
    
    dbConn = datatier.get_dbConn(rds_endpoint, rds_portnum, rds_username, rds_pwd, rds_dbname)

    #
    # first we need to make sure the userid is valid:
    #
    print("**Checking if jobid is valid**")
    
    sql = "SELECT * FROM jobs WHERE jobid = %s;"
    
    row = datatier.retrieve_one_row(dbConn, sql, [jobid])
    
    if row == ():  # no such job
      print("**No such job, returning...**")
      return {
        'statusCode': 400,
        'body': json.dumps("no such job...")
      }
    
    print(row)
    
    status = row[1]
    pdfname = row[2]
    audiokey = row[4]

    print("status:", status)
    print("original data file name:", pdfname)
    print("audiokey:", audiokey)

    #
    # what's the status of the job?
    #
    if status == "pending":
      print("**Job status pending, returning...**")
      #
      return {
        'statusCode': 400,
        'body': json.dumps("pending")
      }
      
    if status == 'error':
      #
      # let's download the results if available, and return the
      # error message in the results file:
      #
      return {
        'statusCode': 400,
        'body': json.dumps("ERROR: unknown")
      }
      
      local_filename = "/tmp/results.txt"
      #
      print("**Job status error, downloading error results from S3**")
      #
      bucket.download_file(results_file_key, local_filename)
      #
      infile = open(local_filename, "r")
      lines = infile.readlines()
      infile.close()
      #
      if len(lines) == 0:
        print("**Job status unknown error given empty results file, returning...**")
        #
        return {
          'statusCode': 400,
          'body': json.dumps("ERROR: unknown, results file was empty")
        }
        
      msg = "ERROR: " + lines[0]
      #
      print("**Job status error, results msg:", msg)
      print("**Returning error msg")
      #
      return {
        'statusCode': 400,
        'body': json.dumps(msg)
      }
    
    #
    # either completed or something unexpected:
    #
    if status != "completed":
      print("**Job status unexpected:", status)
      print("**Returning...**")
      #
      msg = "ERROR: unexpected job status: " + status
      #
      return {
        'statusCode': 400,
        'body': json.dumps(msg)
      }
      
    #
    # if we get here, the job completed. So we should have results
    # to download and return to the user:
    #      
    local_filename = "/tmp/results.txt"
    
    print("**Downloading results from S3**")
    
    bucket.download_file(audiokey, local_filename)
    
    #
    #infile = open(local_filename, "r")
    #ines = infile.readlines()
    #infile.close()
    #
    #for line in lines:
    #  print(line)
    #
  
    #
    # open the file and read as raw bytes:
    #
    infile = open(local_filename, "rb")
    bytes = infile.read()
    infile.close()
    
    #
    # now encode the data as base64. Note b64encode returns
    # a bytes object, not a string. So then we have to convert
    # (decode) the bytes -> string, and then we can serialize
    # the string as JSON for download:
    #
    data = base64.b64encode(bytes)
    datastr = data.decode()

    print("**DONE, returning results**")
    
    #
    # respond in an HTTP-like way, i.e. with a status
    # code and body in JSON format:
    #
    return {
      'statusCode': 200,
      'body': json.dumps(datastr)
    }
    
  except Exception as err:
    print("**ERROR**")
    print(str(err))
    
    return {
      'statusCode': 400,
      'body': json.dumps(str(err))
    }
