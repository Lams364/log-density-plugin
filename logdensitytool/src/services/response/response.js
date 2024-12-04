// Abstract Base Class
class Response {

    static responseId

    constructor() {
        if (new.target === Response) {
            throw new Error("Cannot instantiate abstract class ApiModelService directly.");
        }
    }

    /**
     * extract content form text, as list, each line is one item in list
     * @param {*} text 
     */
    extractLines(text) {
        throw new Error("Method 'extractLines()' must be implemented.");
    }
}

module.exports = Response;
