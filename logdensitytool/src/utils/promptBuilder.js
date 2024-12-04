
function buildPrompt(text, system_prompt, attribute) {
    try {
        system_prompt = String(system_prompt);
        // Create a dynamic regular expression to match the attribute
        const regex = new RegExp(attribute, 'g'); // 'g' for global replacement
        // Replace the attribute with the content
        const updatedPrompt = system_prompt.replace(attribute, text);
        return updatedPrompt;
    } catch (error) {
        console.error("Error in build function:", error.message);
        return null;
    }
}

module.exports = {
    buildPrompt
};