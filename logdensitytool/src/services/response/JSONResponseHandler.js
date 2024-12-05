const Response = require("./response")

class JSONResponseHandler extends Response {

  

  constructor() {
    super()
  }

  /**
   * Returns response ID
   * @returns string of responseId
   */
  static get responseId() {
    return "json";
  }

  /**
   * Extract log_statement and reason in model response and 
   * build response
   * @param {string} text Model response
   * @returns {string} built response :
   * 
   *Ex:
      reason\n
      \t\tlog_statement
   */
  extractLines(text) {
    let lines = this.loadJSON(text)
    if (this.validateJSON(lines) == false) {
      return []
    }
    return ['//' + lines.reason, lines.log_statement]
  }

  validateJSON(json) {
    if (json == null) {
      return false
    }
    if (json.hasOwnProperty('reason') == false || json.hasOwnProperty('log_statement') == false) {
      return false
    }
    return true
  }

  loadJSON(str) {
    let json;
    try {
      json = JSON.parse(str);
    } catch (e) {
      return null;
    }
    return json
  }
}

module.exports = JSONResponseHandler;
