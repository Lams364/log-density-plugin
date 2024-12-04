const Response = require("./response");

class RegexJavaResponse extends Response {
  static responseId = "regex";

  constructor() {
    super();
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
    return this.extractLog(text, tabluation);
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
    //const regex = new RegExp(`"${attribute}"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"`);
    const regex = new RegExp('"' + attribute + '":\s*"([^"\\]*(\\.[^"\\]*)*)"');
    const match = str.match(regex);

    if (match) {
      return match[1].replace(/\\"/g, '"');
    } else {
      return null;
    }
  }

  extractLog(List, str, tabulation) {
    const tabs = "\t".repeat(tabulation);
    const reason = this.regexExtract("reason", str)
    const statement = this.regexExtract("log_statement", str)
    if (reason != null && statement != null) {
      return (
        "// " +
        reason +
        "\n" +
        tabs +
        statement
      );
    } else {
      return null;
    }
  }
}

module.exports = RegexJavaResponse;
