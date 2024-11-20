const vscode = require('vscode');
const axios = require('axios');
const { getGitRemoteUrl } = require('./utils/gitHelper'); // Import the required function
const LogDensityCodeLensProvider = require('./providers/logDensityCodeLensProvider');
const { registerOpenTabsSideBarProvider, OpenTabsSidebarProvider } = require('./providers/openTabsSidebarProvider');
const trainModelService = require('./services/trainModelService');
const runModelService = require('./services/runModelService');
const { registerJavaFileProvider, JavaFileProvider } = require('./providers/javaFileProvider');  
const { registerAnalyzeFileProvider} = require('./providers/analyzeFileProvider')

let trained = false;
let remoteUrl; // Store the remote URL if needed
const codeLensProvider = new LogDensityCodeLensProvider();

async function analyzeDocument(document) {
    if (document?.languageId !== "java") {
        return;
    }
    const { blocks } = await runModelService.runModel(remoteUrl, document.getText());
    codeLensProvider.setData(blocks);  // Update CodeLens with new data
}

async function callGenerationBackendPost(path, args) {
	const URL = 'http://localhost:8888'
	return await axios.post(URL + path, args, {
		headers: {
			'Content-Type': 'application/json',
		}
	});
}

async function callGenerationBackendGet(path, params) {
    /**
     * path : string of path ex: "/help"
     * params : map of params ex: {param1: "testing1", param2: 2}
     */
	const URL = 'http://localhost:8888'
	let parameters = ""
	if (params != null && typeof params === 'object') {
        parameters = '?' + Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }
	return await axios.get(URL + path + parameters);
}

async function generateLogAdvice() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage("No active editor found.");
        return;
    }

    const document = editor.document;
    const selection = editor.selection;
    const cursorLine = selection.active.line; // Ligne actuelle du curseur

    // Fonction pour extraire la méthode autour d'une ligne spécifique
    function getSurroundingMethodText(lineNumber) {
        let startLine = lineNumber;
        let endLine = lineNumber;

        // Chercher le début de la méthode
        while (startLine > 0 && !document.lineAt(startLine).text.trim().endsWith("{")) {
            startLine--;
        }

        // Chercher la fin de la méthode
        while (endLine < document.lineCount - 1 && !document.lineAt(endLine).text.trim().endsWith("}")) {
            endLine++;
        }

        // Récupérer le texte de la méthode complète
        const methodRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
        return document.getText(methodRange);
    }

    const surroundingMethod = getSurroundingMethodText(cursorLine);

    // Générer un prompt spécifique pour le modèle
    const prompt = (
        "Context: You are an AI assistant helping a developer improve their logging. "
        + `Here is the Java method:\n\n${surroundingMethod}\n\n`
        + `Add a single log statement at line ${cursorLine} to enhance observability. `
        + "Focus on key variables or significant events at this point in the code."
    );

    // Progress window
    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: "Generating Log Advice",
            cancellable: false
        },
        async (progress) => {
            progress.report({ message: "Contacting LLM..." });

            try {
                console.log("Calling the LLM model with the following prompt:", prompt);

                // Appeler le backend pour obtenir une suggestion
                const response = await callGenerationBackendPost('/predict', {
                    prompt: prompt,
                    max_new_tokens: 50,
                    temperature: 0.1
                });

                const suggestedLog = response.data.content.trim();
                console.log("Generated log suggestion:", suggestedLog);

                // Insérer la ligne de log à la position donnée
                await editor.edit(editBuilder => {
                    const position = new vscode.Position(cursorLine + 1, 0);
                    editBuilder.insert(position, `\n${suggestedLog}\n`);
                });

                vscode.window.showInformationMessage("Log advice successfully generated and inserted.");
            } catch (error) {
                console.error(error);
                vscode.window.showErrorMessage("Failed to generate log advice.");
            }
        }
    );
}


function activate(context) {
    const workspaceRoot = vscode.workspace.rootPath;

    // Register Codelens
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'java' }, codeLensProvider));

    context.subscriptions.push(vscode.commands.registerCommand('extension.showLogDensityInfo', block => {
        vscode.window.showInformationMessage(`Details for block starting at line ${block.blockLineStart}: ${JSON.stringify(block)}`);
    }));
 
    // Register AnalyzeFileProvider and JavaFileProvider and OpenTabsSidebarProvider
    const openTabsSidebarProvider = registerOpenTabsSideBarProvider(context);
    const analyzeFileProvider = registerAnalyzeFileProvider(context);
    const javaFileProvider = registerJavaFileProvider(context, analyzeFileProvider);
    analyzeFileProvider.setJavaFileProvider(javaFileProvider);

    // Initialize and use the Git remote URL
    getGitRemoteUrl().then((url) => {
        remoteUrl = url;
        console.log("Git detected url.")
    });

    let disposableTrain = vscode.commands.registerCommand('extension.sendGitHubUrl', async () => {
        const url = await vscode.window.showInputBox({ prompt: 'Enter GitHub URL to train model', value: remoteUrl });
        if (url) {
            await trainModelService.trainModel(url);
            remoteUrl = url;
            console.log(`setting github url... ${remoteUrl}`)
            openTabsSidebarProvider.setUrl(remoteUrl);
            analyzeFileProvider.setRemoteUrl(remoteUrl);
            trained = true;
            const activeEditor = vscode.window.activeTextEditor;

            if (activeEditor) {
                await analyzeDocument(activeEditor.document);
            }
        } else {
            vscode.window.showErrorMessage('GitHub URL is required');
        }


    });

    // File event handlers, sends file content to backend on change
    const analyzeEditedFileDisposable = vscode.workspace.onDidChangeTextDocument(event => {
        if (trained && remoteUrl && event.document.languageId === "java") {
            analyzeDocument(event.document);
        }
    });

    // File event handlers, sends file content to backend on file open
    const analyzeOpenedFileDisposable = vscode.workspace.onDidOpenTextDocument(document => {
        if (trained && remoteUrl && document.languageId === "java") {
            analyzeDocument(document);
        }
    });

    const analyzeNewJavaFilesCommand = vscode.commands.registerCommand('extension.analyzeNewJavaFiles', async () => {
        const allFiles = await getAllJavaFiles();
        const results = await analyzeProjectFiles(allFiles);
        if (results) {
            console.log(results);  
            vscode.window.showInformationMessage('New Java files analysis complete. Check the console for details.');
        }
    });

    let generateLog = vscode.commands.registerCommand('log-advice-generator.generateLogAdvice', generateLogAdvice);

    let changeModel = vscode.commands.registerCommand('log-advice-generator.changeModelId', async () => {
        const response = await callGenerationBackendGet('/model_info', null);
        const MODEL_ID = response.data.model_name;
        const model = await vscode.window.showInputBox({ prompt: 'Enter a HuggingFace Model ID', value: MODEL_ID });
        
        if (model) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Changing Model to: ${model}`,
                cancellable: false
            }, async (progress) => {
                progress.report({message: "Initializing model change..." });
                
                try {
                    const response = await callGenerationBackendPost('/change_model', { hf_model_id: model });
                    
                    if (response.data.completed === true) {
                        vscode.window.showInformationMessage('Model Change has been successful, Model configured: ' + response.data.model_name);
                    } else {
                        vscode.window.showErrorMessage('Model Change Failed, Model configured: ' + response.data.model_name);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage('An error occurred during the model change process.');
                }
            });
        } else {
            vscode.window.showErrorMessage('MODEL ID is required');
        }
    });
    

    let changeToken = vscode.commands.registerCommand('log-advice-generator.changeToken', async () => {
        const token = await vscode.window.showInputBox({ prompt: 'Enter a HuggingFace Model ID'});
        if (token) {
            console.log(`Changing token`)
            const response = await callGenerationBackendPost('/change_token', {hf_token: token})
			console.log(JSON.stringify(response.data, null, 2))
            if (response.data.completed == true) {
                vscode.window.showInformationMessage('Token Change has been successfull')
            } else {
				vscode.window.showErrorMessage('Token Change Failed');
			}
        } else {
            vscode.window.showErrorMessage('TOKEN is required');
        }
    });

    let getModelInfo = vscode.commands.registerCommand('log-advice-generator.modelInfo', async () => {
		const response = await callGenerationBackendGet('/model_info', null)
		console.log(JSON.stringify(response.data, null, 2))
        vscode.window.showInformationMessage('The model configured is [' + response.data.model_name + ']')
		vscode.window.showInformationMessage('Running on [' + response.data.device + ']')


    });

    context.subscriptions.push(
        disposableTrain,
        analyzeEditedFileDisposable,
        analyzeOpenedFileDisposable,
        generateLog,
        changeModel,
        changeToken,
        getModelInfo
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
