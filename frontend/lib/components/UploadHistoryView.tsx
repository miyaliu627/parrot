import { Flex } from "@mantine/core";
import { IUploadedFile } from "../interfaces";
import { RootState } from "../store/reducer";
import { delete_file, set_active_file } from "../store/slice";
import { IconDeviceSpeaker, IconEdit, IconFileTypePdf, IconTrash } from "@tabler/icons-react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

interface ISingleFile {
    file: IUploadedFile;
};

const SingleFile: React.FC<ISingleFile> = ({file}) => {
    const dispatch = useDispatch();

    return (
        <Flex gap="md" p="xs" justify="space-between" align="center">
            <Flex gap="md" justify="center" align="center">
                <IconFileTypePdf stroke={1} style={{ color: 'var(--mantine-color-red-9)' }}/>
                <div style={{fontWeight: 400, whiteSpace: "nowrap"}}>{file.fileName}</div>
                <div style={{fontWeight: 400, color: 'var(--mantine-color-gray-5)'}}>{`(${file.awsJobId})` || "(xxxx)"}</div>
            </Flex>

            <Flex gap="md" justify="center" align="center">
                <IconDeviceSpeaker onClick={() => {
                    dispatch(set_active_file(file.localKey));
                }} stroke={1} style={{ color: file.audioS3Key == "exists" ? 'var(--mantine-color-blue-9)' : 'var(--mantine-color-gray-5)' }}/>
                <IconEdit onClick={() => {
                    dispatch(set_active_file(file.localKey));
                }} stroke={1} style={{ color: 'var(--mantine-color-green-9)' }}/>
                <IconTrash onClick={() => {
                    dispatch(delete_file(file.localKey));
                }} stroke={1} style={{ color: 'var(--mantine-color-red-9)' }}/>
            </Flex>
        </Flex>
    );
}

export const UploadHistoryView: React.FC = ({}) => {
    const allFiles = useSelector((state: RootState) => state.main.fileHistory);

    return (
        <Flex style={{border: "0.5px solid black", borderRadius: "16px"}} p="xs" gap="xs" direction="column-reverse">
            {allFiles && allFiles.map((single_file: IUploadedFile, index: number) => (
                <SingleFile key={`file_${index}`} file={single_file} />
            ))}
            {
                allFiles.length == 0 && <div style={{fontWeight: 400}}>Upload a file to get started!</div>
            }
        </Flex>
    );
};

export default UploadHistoryView;
