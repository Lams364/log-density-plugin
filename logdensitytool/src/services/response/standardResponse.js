const Response = require("./response")

class StandardResponse extends Response {

  constructor() {
    super()
  }

  /**
   * Returns response ID
   * @returns string of responseId
   */
  static get responseId() {
    return "standard";
  }

  /**
   * Return model response without modification
   * @param {string} text 
   * @returns (string) text
   */
  extractLines(text) {
    return text.split('\n')
  }

}

module.exports = StandardResponse;
