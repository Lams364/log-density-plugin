
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

function getSurroundingMethodText(lineNumber) {
    let startLine = lineNumber;
    let endLine = lineNumber;

    // Compteur pour suivre les accolades
    let openBraces = 0;

    // Chercher le début de la méthode
    while (startLine > 0) {
        const lineText = document.lineAt(startLine).text.trim();

        // Compter les accolades fermées et ouvertes
        openBraces += (lineText.match(/\}/g) || []).length;
        openBraces -= (lineText.match(/\{/g) || []).length;

        if (openBraces < 0) {
            // Trouvé le début de la méthode
            break;
        }

        startLine--;
    }

    // Réinitialiser le compteur pour chercher la fin
    openBraces = 0;

    // Chercher la fin de la méthode
    while (endLine < document.lineCount - 1) {
        const lineText = document.lineAt(endLine).text.trim();

        // Compter les accolades ouvertes et fermées
        openBraces += (lineText.match(/\{/g) || []).length;
        openBraces -= (lineText.match(/\}/g) || []).length;

        if (openBraces === 0 && lineText.includes('}')) {
            // Trouvé la fin de la méthode
            break;
        }

        endLine++;
    }

    // Récupérer le texte de la méthode complète
    const methodRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
    return document.getText(methodRange);
}

module.exports = {
    buildPrompt,
    getSurroundingMethodText
};