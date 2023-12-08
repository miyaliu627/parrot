import express, { Request, Response } from "express";
import axios from "axios";

const router = express.Router();

const UPLOAD_API_ROUTE = "https://kxwo4yrvt3gmuufzmslltjmllu0gwgsj.lambda-url.us-east-2.on.aws/";
const CONVERT_API_ROUTE = "https://dwlbwgi274dm46pucxpnqgu2uy0wjdux.lambda-url.us-east-2.on.aws/";
const DELETE_API_ROUTE = (jobid: string) => `https://lv6t6dcoml2sqfue6mxmpalw5e0jquzn.lambda-url.us-east-2.on.aws/${jobid}`;
const DOWNLOAD_API_ROUTE = (jobid: string) => `https://m0bduuhs7l.execute-api.us-east-2.amazonaws.com/draft/download/${jobid}`;

// if it works
router.route("/test").get((_: Request, res: Response) => {
  res.json({ status: "It works!" });
});

router.route("/upload").post((req: Request, res: Response) => {
  const file_name = req.body.filename;
  const file_data = req.body.data;

  axios.post(UPLOAD_API_ROUTE, {filename: file_name, data: file_data}).then((response) => {
    res.status(200).json({
      jobid: response.data.jobid,
      textkey: response.data.textkey,
      body: response.data.body
    });
  }).catch((error) => {
    res.status(error.response.status || 500).json({msg: error});
  });
});

router.route("/convert").post((req: Request, res: Response) => {
  const text_key = req.body.txtkey;

  axios.post(CONVERT_API_ROUTE, {txtkey: text_key}).then((_response) => {
    res.status(200).json({msg: "success"});
  }).catch((error) => {
    res.status(error.response.status || 500).json({msg: "failure", detail: error});
  })
});

router.route("/download/:jobid").get((req: Request, res: Response) => {
  const job_id = req.params.jobid;

  axios.get(DOWNLOAD_API_ROUTE(job_id)).then((response) => {
    res.status(200).send(response.data);
  }).catch((error) => {
    res.status(error.response.status || 500).json({msg: error});
  });
});

router.route("/delete/:jobid").delete((req: Request, res: Response) => {
  const job_id = req.params.jobid;

  axios.delete(DELETE_API_ROUTE(job_id)).then((response) => {
    res.status(200).send(response.data);
  }).catch((error) => {
    res.status(error.response.status || 500).json({msg: error});
  });
});

module.exports = router;
export default router;
