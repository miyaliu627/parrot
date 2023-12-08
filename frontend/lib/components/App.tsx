"use client";
import useWindowSize from "../hooks/useWindowSize";
import UploadHistoryView from "./UploadHistoryView";
import ReadVoiceView from "./ReadVoiceView";
import CurrentTextView from "./CurrentTextView";
import FileUploadView from "./FileUploadView";
import React, { useEffect } from "react";
import { Flex, Notification, rem } from "@mantine/core";
import { IconFeather } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { clear_error_message } from "../store/slice";
import { RootState } from "../store/reducer";

export const App: React.FC = ({}) => {
    const windowSize: [number, number] = useWindowSize();
    const smallScreen = (windowSize[0] < 0.75*windowSize[1]) || windowSize[0] < 1296;
    const dispatch = useDispatch();
    const error_msg = useSelector((state: RootState) => state.main.errorMsg);

    useEffect(() => {
        dispatch(clear_error_message());
    }, [dispatch])

    return (
        <div style={{padding: "1rem"}}>
            <Flex justify="center" align="center" gap="md">
                <IconFeather stroke={1} size={36} style={{ color: 'var(--mantine-color-red-6)' }}/>
                <p><span style={{fontWeight: 600}}>Parrot</span>: Convert PDF to Text and Audio</p>
            </Flex>
            <Flex
                gap="md"
                justify="center"
                align="flex-start"
                direction={smallScreen ? "column" : "row"}
                wrap="wrap"
                p="sm">
                    <Flex direction="column" gap="lg" p="md" style={{width: smallScreen ? "100%" : "40%"}}>
                        <FileUploadView />
                        <UploadHistoryView />
                    </Flex>
                    <Flex direction="column" gap="lg" p="md" style={{width: smallScreen ? "100%" : "50%"}}>
                        <CurrentTextView />
                        <ReadVoiceView />
                    </Flex>
            </Flex>
            {error_msg && <Notification onClose={() => {
                dispatch(clear_error_message())
            }} withBorder color="orange" title="ERROR" pos="absolute" bottom={rem(20)} right={rem(20)} w={rem(500)}>
                {error_msg}
            </Notification>}
        </div>
    );
}


export default App;