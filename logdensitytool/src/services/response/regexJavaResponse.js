const Response = require("./response");

class RegexJavaResponse extends Response {

  constructor() {
    super();
  }

  /**
   * Returns response ID
   * @returns string of responseId
   */
  static get responseId() {
    return "regex";
  }

  /**
   * Extract log_statement and reason in model response and 
   * build response
   * @param {string} text Model response
   * @param {int} tabluation tabulation in Code editor
   * @returns {string} built response :
   * 
   *Ex:
      reason\n
      \t\tlog_statement
    */
  extractLines(text) {
    return this.extractLog(text);
  }

  extractLogStatement(str) {
    //const regex = /"log_statement":\s*"([^"\\]*(\\.[^"\\]*)*)"/;

    const regex = /"log_statement"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/;
    const match = str.match(regex);

    if (match) {
      return match[1].replace(/\\"/g, '"');
    } else {
      return null;
    }
  }

  extractLogReason(str) {
    const regex = /"reason"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/;
    const match = str.match(regex);

    if (match) {
      return match[1].replace(/\\"/g, '"');
    } else {
      return null;
    }
  }

  regexExtract(attribute, str) {
    // Create a dynamic regex with the attribute inserted
    const regex = new RegExp(`"${attribute}"\\s*:\\s*"([^"\\\\]*(\\\\.[^"\\\\]*)*)"`);
    const match = str.match(regex);

    if (match) {
      return match[1].replace(/\\"/g, '"');
    } else {
      return null;
    }
  }

  extractLog(str) {
    const reason = this.regexExtract("reason", str)
    const statement = this.regexExtract("log_statement", str)
    if (reason != null && statement != null) {
      return ["//" + reason, statement]
    } else {
      return null;
    }
  }
}

module.exports = RegexJavaResponse;
