const { Post, Get } = require('../../utils/api');
const ApiModel = require('./apiModel');

class HfApiModel extends ApiModel {

  static apiId = "huggingface"

  constructor(url, port, systemPrompt, initialModel, initialToken) {
    super(url, port, systemPrompt, initialModel, initialToken);
    this.init(initialModel, initialToken)
  }
  
  /**
   * Generates a response or output based on the provided input data.
   * @param {string} model - The name of the model to use.
   * @param {string} system - The system context for the generation. Override System config
   * @param {string} prompt - The input prompt for the model.
   * @param {string} temperature - Temperature of model response.
   * @param {string} max_token - Max tokens generated by model for response.
   * @returns {string} Model response
   */
  async generate(model, system, prompt, temperature, max_token) {
    let usedSys = this.systemContext
    if (system !=null && system != "") {
      usedSys = system
    }
    const response = await Post(this.url, this.port, '/predict', 
      {
        model: model, // Not implemented
        prompt: this.buildPrompt(usedSys, prompt), 
        max_new_tokens: max_token, 
        temperature: temperature // Not implemented
      }) 
    return response.data.content;
  }

  /**
   * Changes the model being used.
   * @param {string} modelName - The name of the new model.
   * @returns {completed: boolean, model: string} completed, true if model changed, false if not, model, indicate the model configured
   */
  async changeModel(modelName) {
    const response = await Post(this.url, this.port, '/change_model', {hf_model_id: modelName})
    this.model = modelName
    return {completed: response.data.completed, model: response.data.model_name}
  }
  
  /**
   * Retrieves information about the models loaded.
   * @returns {model: string|list} list of models or string
   */
  async info() {
    const response = await Get(this.url, this.port, '/model_info', null)
    return {model: response.data.model_name}
  }

  /**
   * Get current configured
   * @returns {model: string} Model configured
   */
  async getModel() {
    const response = await Get(this.url, this.port, '/model_info', null)
    if (response.data.hasOwnProperty('model_name')) {
        return response.data.model_name
    } else 
        return this.model
  }

  /**
   * Updates the token used for authentication or API access.
   * @param {string} token - The new token string.
   * @returns {completed: boolean} completed, true if model changed, false if not
   */
  async changeToken(token) {
    this.token = token
    const response = await Post(this.url, this.port, '/change_token', {hf_token: this.token})
    //console.log(JSON.stringify(response.data, null, 2))
    return {completed: response.data.completed, message: ""}
  }

  /**
   * 
   * @param {string} model - Model used for initalisation
   * @param {string} token - Token used for initalisation
   */
  async init(model, token) {
    this.changeModel(model);
    this.changeToken(token);
  }

  buildPrompt(context, prompt) {
    return `[INST]CONTEXT: ${context}\n\nINPUT: ${prompt} [/INTS]`
  }
}

module.exports = HfApiModel;