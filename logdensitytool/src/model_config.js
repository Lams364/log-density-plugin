/* eslint-disable no-unused-vars */
// API IDs available
const HuggingFaceApiModel = require("./services/apiModel/huggingFaceApiModelService");
const OllamaApiModel = require("./services/apiModel/ollamaApiModelService");

// Response IDs type available
const JsonResponse = require("./services/response/jsonResponseService");
const RegexResponse = require("./services/response/regexResponseService")
const StandardResponse = require("./services/response/standardResponseService");

let configuration = {
    api_id : OllamaApiModel.apiId, //ollama and huggingface available
    url : "http://localhost",
    port : "11434",
    prompt_file : "generate_log.txt", // From prompt Folder
    default_model : "llama3.2:3b",
    default_token : "", // Only used for huggingface
    response_id :  JsonResponse.responseId, // select valid response id
    attributes_to_comment : ["reason"], // list of attributes to comment
    comment_string: "//", // Comment string to add
    injection_variable: "{vscode_content}" // variable to inject vscode content in prompt
}


module.exports = {
    configuration
};