"use client";
import axios from "axios";
import React, { useState } from "react";
import { Group, rem } from "@mantine/core";
import { Dropzone, DropzoneProps, FileWithPath, PDF_MIME_TYPE } from "@mantine/dropzone";
import { RootState } from "../store/reducer";
import { upload_new_file, set_file, set_active_file, set_error_msg, clear_error_message } from "../store/slice";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

const FILE_LIMIT_KB = 200;

const random_3letter_b16 = () => {
    return Math.round(Math.random()*4096).toString(16).padStart(3, "0").toUpperCase()
}

export default function FileUploadView(props: Partial<DropzoneProps>) {
    // State
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const api_endpoint = useSelector((state: RootState) => state.main.apiEndpoint);

    const upload = (files: FileWithPath[]) => {
        setLoading(true);
        dispatch(clear_error_message())
        for(let file of files) {
            const file_reader = new FileReader();
            file_reader.onload = (e: ProgressEvent<FileReader>) => {
                const base64String = e.target?.result?.toString().split(',')[1] ?? '';
                const localKey = `${random_3letter_b16()}-${random_3letter_b16()}-${random_3letter_b16()}}`
                // if there is a hash collision by doing this,
                // I will bet my life on the next NU vs Purdue basketball game

                axios.post(`${api_endpoint}/upload`, {
                    filename: file.name,
                    data: base64String
                }).then((response) => {
                    dispatch(upload_new_file({
                        localKey: localKey,
                        fileName: file.name,
                        fileContent: base64String // File content in base64 format
                    }));
                    dispatch(set_file({
                        localKey,
                        jobid: response.data.jobid,
                        textkey: response.data.textkey,
                        body: response.data.body
                    }));
                    dispatch(set_active_file(localKey));
                    setLoading(false);
                }).catch((error) => {
                    console.error(error);
                    if (error.response) {
                        dispatch(set_error_msg(`Bad response code (${error.response.status || "not 2xx"}). Some files will not work. We are not sure the precise reason why.`));
                        setLoading(false);
                    } else if (error.request) {
                        dispatch(set_error_msg("Server did not respond."))
                        setLoading(false);
                    } else {
                        dispatch(set_error_msg(`Something odd happened (${error.message}).`))
                        setLoading(false);
                    }
                });
            }
            file_reader.readAsDataURL(file);
        }
    }

    return (
        <Dropzone
            onDrop={upload}
            onReject={(_files) => dispatch(
                set_error_msg(
                    `The file you uploaded is invalid. This app only supports PDF files, and the max size is ${FILE_LIMIT_KB} KB.`
                    )
                )}
            maxSize={FILE_LIMIT_KB * 1024}
            accept={PDF_MIME_TYPE}
            style={{border: "0.5px dashed black", borderRadius: "16px"}}
            loading={loading}
            {...props}
        >
            <Group justify="center" gap="xl" mih={400} style={{ pointerEvents: 'none' }}>
                <Dropzone.Accept>
                    <IconUpload
                        style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
                        stroke={1}
                    />
                </Dropzone.Accept>
                <Dropzone.Reject>
                    <IconX
                        style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
                        stroke={1}
                    />
                </Dropzone.Reject>
                <Dropzone.Idle>
                    <IconPhoto
                        style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}
                        stroke={1}
                    />
                </Dropzone.Idle>
                <div>
                    <p>Upload a PDF! (max {FILE_LIMIT_KB} KB)</p>
                </div>
            </Group>
        </Dropzone>
    );
};
