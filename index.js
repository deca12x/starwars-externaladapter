/* eslint-disable comma-dangle */
/* eslint-disable semi */
/* eslint-disable quotes */
const { Requester, Validator } = require("@chainlink/external-adapter");

// Define custom error scenarios for the API. Return true for the adapter to retry.
const customError = (data) => {
  if (data.Response === "Error") return true;
  return false;
};

// Define custom parameters to be used by the adapter.
// Extra parameters can be stated in the extra object,
// with a Boolean value indicating whether or not they
// should be required.
const customParams = {
  peopleId: ["peopleId"],
  endpoint: false,
};

const createRequest = (input, callback) => {
  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(callback, input, customParams);
  const jobRunID = validator.validated.id;
  const peopleId = validator.validated.data.peopleId;

  const url = `https://swapi.dev/api/people/${peopleId}`;

  const params = {
    peopleId,
  };

  // // IF THE API WAS PASSWORD PROTECTED...
  // API_KEY = process.env.API_KEY; // import dotenv at the top of the file
  // constheaders = {
  //   Authorization: `??? ${API_KEY}`,
  // }; // and add headers to the config object below

  // This is where you would add method and headers
  // you can add method like GET or POST and add it to the config
  // The default is GET requests
  // method = 'get'
  // headers = 'headers.....'
  const config = {
    url,
    params,
  };

  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config, customError)
    .then((response) => {
      // It's common practice to store the desired value at the top-level
      // result key. This allows different adapters to be compatible with
      // one another.
      // response.data.result = Requester.validateResultNumber(response.data, [
      //   tsyms,
      // ]);
      // callback(response.status, Requester.success(jobRunID, response.data));
      callback(response.status, {
        jobRunID,
        status: "success",
        data: { name: response.data },
      });
    })
    .catch((error) => {
      callback(500, Requester.errored(jobRunID, error));
    });
};

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data);
  });
};

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data);
  });
};

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false,
    });
  });
};

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest;
