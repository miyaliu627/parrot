import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { IUploadedFile } from '../interfaces';

interface MainState {
  fileHistory: IUploadedFile[];
  apiEndpoint: string;
  mostRecentFile?: IUploadedFile;
  errorMsg?: string;
}

const initialState: MainState = {
  fileHistory: [],
  apiEndpoint: "https://lionfish-app-qvkn2.ondigitalocean.app",
  mostRecentFile: undefined,
  errorMsg: ""
};

export const mainSlice = createSlice({
  name: '_EVERYTHING',
  initialState,
  reducers: {
    upload_new_file: (state, action: PayloadAction<IUploadedFile>) => {
      if(!state.fileHistory) {
        state.fileHistory = [action.payload];
      } else {
        state.fileHistory.push(action.payload);
      }
      state.mostRecentFile = action.payload;
    },
    set_active_file: (state, action) => { // set active file by key
      state.mostRecentFile = state.fileHistory.filter((e) => e.localKey == action.payload)[0];
    },
    delete_file: (state, action) => { // set active file by key
      if(state.mostRecentFile?.localKey == action.payload) {
        state.mostRecentFile = {
          fileName: "",
          fileContent: "",
          localKey: -1
        };
      }
      state.fileHistory = state.fileHistory.filter((e) => e.localKey != action.payload);
    },
    set_file: (state, action) => {
      let file_to_set = action.payload.localKey;
      state.fileHistory = state.fileHistory.map((file) => {
        if(file.localKey == file_to_set) {
          let temp_file = file;
          temp_file.awsJobId = ((action.payload.jobid as string).match(/\d+/g) || ["0000"])[0];
          temp_file.content = (action.payload.body as string).trim();
          temp_file.awsTextKey = action.payload.textkey;
          return temp_file;
        } else {
          return file;
        }
      });
    },
    set_error_msg: (state, action) => {
      state.errorMsg = action.payload;
    },
    clear_error_message: (state) => {
      state.errorMsg = "";
    },
    set_active_audio: (state, action) => {
      let file_to_set = action.payload.lk;
      state.fileHistory = state.fileHistory.map((file) => {
        if(file.localKey == file_to_set) {
          let temp_file = file;
          temp_file.audioS3Key = "exists";
          temp_file.audioRaw = action.payload.ak;
          return temp_file;
        } else {
          return file;
        }
      });

      state.mostRecentFile = state.fileHistory.filter((e) => e.localKey == file_to_set)[0];
    }
  }
})

export const {
  upload_new_file,
  set_active_file,
  delete_file,
  set_file,
  set_error_msg,
  clear_error_message,
  set_active_audio
} = mainSlice.actions

export default mainSlice.reducer
