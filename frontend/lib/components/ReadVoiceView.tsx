import { Flex, InputDescription, InputLabel } from "@mantine/core";
import { RootState } from "../store/reducer";
import { IconFileMusic } from "@tabler/icons-react";
import React from "react";
import { useSelector } from "react-redux";

/**
 * Convert base64 to a Blob object
 * @param base64 Base 64 encoded string
 * @param mimeType Type of Blob
 * @returns Blob()
 */
function base64ToBlob(base64: string, mimeType: string) {
    if(base64 == "") return;

    const binaryString = window.atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], {type: mimeType});
}

export const ReadVoiceView: React.FC = ({}) => {
    const mostRecentFile = useSelector((state: RootState) => state.main.mostRecentFile);
    let audioBlob = null;

    if(mostRecentFile?.audioRaw) {
        audioBlob = base64ToBlob(mostRecentFile.audioRaw, "audio/mp3");
    }

    return (
        <Flex direction="column" gap="xs">
            <InputLabel>Text Readback
                <InputDescription style={{fontWeight: 400}}>The content of the PDF will be read back to you as an audio file.</InputDescription>
            </InputLabel>
            {audioBlob && <>
                <audio src={URL.createObjectURL(audioBlob)} controls />
            </>}
            <Flex gap="sm" justify="flex-start" align="center">
                <IconFileMusic stroke={1} style={{ 
                    color: mostRecentFile?.audioS3Key == "exists" ? 'var(--mantine-color-red-9)' : 'var(--mantine-color-gray-5)' }}/>  
                <div>{mostRecentFile?.audioRaw ? mostRecentFile.fileName : "AUDIO UNAVAILABLE"}</div>
                
            </Flex>
        </Flex>
    );
};

export default ReadVoiceView;
