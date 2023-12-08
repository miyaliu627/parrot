import axios from "axios";
import React, { useState } from "react";
import { Button, Flex, Textarea } from "@mantine/core";
import { RootState } from "../store/reducer";
import { useDispatch, useSelector } from "react-redux";
import { set_active_audio, set_error_msg } from "../store/slice";

export const CurrentTextView: React.FC = ({}) => {
    // Some state variables
    const mostRecentFile = useSelector((state: RootState) => state.main.mostRecentFile);
    const content = mostRecentFile?.content || "";
    const [loading, setLoading] = useState(false);

    // Redux global state setter
    const dispatch = useDispatch();

    // Get API endpoint from global state
    const api_endpoint = useSelector((state: RootState) => state.main.apiEndpoint);
    
    return (
        <Flex direction="column" gap="sm">
            <Textarea
                label="Text to Convert"
                description="Text you want read back to you."
                placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur interdum mollis tincidunt. Aenean ligula erat, faucibus vel pretium vel, condimentum a ligula. Proin pellentesque."
                value={content.toString()}
                autosize
                minRows={16}
                maxRows={24}
                readOnly
            />
            <Button disabled={!mostRecentFile?.awsTextKey} loading={loading} style={{width: "fit-content"}} onClick={() => {
                if(mostRecentFile?.awsJobId) {
                    setLoading(true);
                    axios.post(`${api_endpoint}/convert`, {
                        txtkey: mostRecentFile.awsTextKey
                    })
                    .then((_response) => {
                        axios.get(`${api_endpoint}/download/${mostRecentFile.awsJobId}`)
                        .then((response2) => {
                            dispatch(set_active_audio({
                                lk: mostRecentFile.localKey,
                                ak: response2.data
                            }));
                            setLoading(false);
                        })
                    }).catch((err) => {
                        console.error(err);
                        dispatch(set_error_msg(`Failed to convert to audio due to ${err}`))
                        setLoading(false);
                    });
                }
            }} color="green" variant="outline">Submit</Button>
        </Flex>
    );
};

export default CurrentTextView;
