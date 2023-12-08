import json
import boto3
import os
import datatier

from configparser import ConfigParser

def lambda_handler(event, context):
    try:
        print("**STARTING**")
        print("**lambda: parrot_reset**")

        # setup AWS based on config file:
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
    
        #configure for S3 access:
        
        s3_profile = 's3readonly'
        boto3.setup_default_session(profile_name=s3_profile)
        
        bucketname = configur.get('s3', 'bucket_name')
        
        s3 = boto3.resource('s3')
        bucket = s3.Bucket(bucketname)
    
        # configure for RDS access
        rds_endpoint = configur.get('rds', 'endpoint')
        rds_portnum = int(configur.get('rds', 'port_number'))
        rds_username = configur.get('rds', 'user_name')
        rds_pwd = configur.get('rds', 'user_pwd')
        rds_dbname = configur.get('rds', 'db_name')

        # open connection to the database:
        print("**Opening connection**")

        dbConn = datatier.get_dbConn(rds_endpoint, rds_portnum, rds_username, rds_pwd, rds_dbname)

        # Delete jobs with specified bucket_ids from S3 and the database
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

      
        delete_jobs_from_s3_and_db(dbConn, jobid)

        # Additional reset steps can be added here if needed

        # respond in an HTTP-like way, i.e. with a status code and body in JSON format:
        print("**DONE, returning success**")
        return {
            'statusCode': 200,
            'body': json.dumps("success")
        }

    except Exception as err:
        print("**ERROR**")
        print(str(err))

        return {
            'statusCode': 400,
            'body': json.dumps(str(err))
        }

def delete_jobs_from_s3_and_db(dbConn, jobid):
    try:
        sql = "SELECT audiokey, txtkey FROM jobs WHERE jobid = %s"
        result = datatier.retrieve_one_row(dbConn, sql, [jobid])
    
        if not result:
            print(f"No jobs found in the database for bucket_id {jobid}")
            return {
                'statusCode': 404,
                'body': json.dumps("No jobs found in the database for the given jobid")
            }
    
        audiokey, txtkey = result
            
        # # Delete files related to this job from S3
        # s3.Object(bucketname, txtkey).delete()
        # s3.Object(bucketname, audiokey).delete()
 
        # Delete jobs from the database
        print(f"**Deleting files related to jobid {jobid} from S3**")
    
        # Assuming you have a jobs table with a foreign key 'bucket_id'
        sql = "DELETE FROM jobs WHERE jobid = %s"
        datatier.perform_action(dbConn, sql, [jobid])
    
    except Exception as err:
        print("**ERROR**")
        print(str(err))

        return {
            'statusCode': 400,
            'body': json.dumps(str(err))
        }

