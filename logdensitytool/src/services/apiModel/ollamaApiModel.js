const { Post, Get } = require('../../utils/api');
const ApiModel = require('./apiModel');
const CircularJSON = require('circular-json');

/**
 * Ollama API DOC : https://github.com/ollama/ollama/blob/main/docs/api.md
 */

class OllamaApiModel extends ApiModel{

  static apiId = "ollama"

  constructor(url, port, initialModel, initialToken) {
    super(url, port, initialModel, initialToken);
    this.init(initialModel, initialToken)
  }
  
  /**
   * Generates a response or output based on the provided input data.
   * @param {string} model - The name of the model to use.
   * @param {string} system - The system message used to specify custom behavior.
   * @param {string} prompt - The input prompt for the model.
   * @param {string} temperature - Temperature of model response.
   * @param {string} max_token - Max tokens generated by model for response.
   * @returns {string} Model response
   */
  async generate(model, system, prompt, temperature, max_token) {

    let usedTokens = 128 // (Default: 128, -1 = infinite generation, -2 = fill context)
    if (max_token !=null && max_token >= -2) usedTokens = max_token

    let usedTemp = 0.8 // (Default: 0.8) value between 0 and 1. Increasing the temperature will make the model answer more creatively. 
    if (temperature !=null && temperature >= 0 && temperature <= 1 ) usedTemp = temperature

    const response = await Post(this.url, this.port, '/api/generate', {
        model: model, // Not implemented
        prompt: prompt, 
        system: system,
        stream: false,
        options: {
            temperature: temperature,
            num_predict: max_token
        }
    }) 
    return response.data.response;
  }

  /**
   * Changes the model being used.
   * @param {string} modelName - The name of the new model.
   * @returns {completed: boolean, model: string} completed, true if model changed, false if not, model, indicate the model configured
   */
  async changeModel(modelName) {
    if (this.model != modelName) {
      console.log(`Unloading ${this.model}`)
      await this.unload(this.model)
    }
    console.log(`Pull ${modelName}`)
    const response = await Post(this.url, this.port, '/api/pull', {
        model: modelName,
        stream: false
    })
    console.log(`Loading ${modelName}`)
    await this.load(modelName)
    this.model = modelName
    return {completed: response.data.completed, model: response.data.model_name}
  }
  
  /**
   * Retrieves information about the models loaded.
   * @returns {model: string|list} list of models or string
   */
  async info() {
    const response = await Get(this.url, this.port, '/api/ps', null)
    // !! Circular reference in response, use next line to log
    //console.log(CircularJSON.stringify(response))
    if (response.data.models.length > 0) {
      let model_list = [];

      // Iterate through the models and add model.name to the array
      response.data.models.forEach(model => {
        model_list.push(model.name);
      });
      return {model: model_list};
    } else 
        return {model: this.model}
  }

  /**
   * Retrieves information about the current model or API.
   * @returns {string} Model configured
   */
  async getModel() {
    const response = await Get(this.url, this.port, '/api/ps', null)
    if (response.data.models.length > 0) {
        return response.data.models[0].name;
    } else 
        return this.model
  }

  /**
   * Updates the token used for authentication or API access.
   * @param {string} token - The new token string.
   * @returns {String} completed, true if model changed, false if not
   */
  async changeToken(token) {
    return {completed: false, message: "Not implemented, not used with Ollama"}
  }

  /**
   * 
   * @param {string} model - Model used for initalisation
   * @param {string} token - Token used for initalisation
   */
  async init(model, token) {
    this.changeModel(model);
  }

  async load(model) {
    const response = await Post(this.url, this.port, '/api/generate', {
        model: model,
        stream: false,
    })
    return response.data
  }

  async unload(model) {
    const response = await Post(this.url, this.port, '/api/generate', {
        model: model,
        stream: false,
        keep_alive: 0
    })
    return response.data

  }
}

module.exports = OllamaApiModel;
