
export interface IUploadedFile {
    localKey: string | number;
    fileName: string;
    fileContent: string;
    content?: string;
    audioS3Key?: string;
    awsJobId?: string;
    awsTextKey?: string;
    audioRaw?: string;
}