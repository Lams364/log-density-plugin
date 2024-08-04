const vscode = require('vscode');
const path = require('path');
const { analyzeFiles } = require('../services/analyzeProject');
const { readFile } = require('../utils/fileReader');

class AnalyzeFileProvider {
    constructor(analysisPreviewProvider) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.analyzeList = new Map();
        this.analysisPreviewProvider = analysisPreviewProvider;
        this.remoteUrl = '';
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    setRemoteUrl(url) {
        this.remoteUrl = url;
        console.log(`Remote URL updated to: ${url}`)
        console.log(`this.remoteUrl is set to: ${this.remoteUrl}`)
    }

    addFileToAnalyze(javaItem) {
        if (!this.analyzeList.has(javaItem.filepath)) {
            this.analyzeList.set(javaItem.filepath, javaItem);
            this.refresh();
        } else {
            console.log(`File already in list: ${javaItem.filepath}`);
        }
    }

    removeFileFromAnalyze(filePath) {
        let originalLength = this.analyzeList.length;
        this.analyzeList = this.analyzeList.filter(item => item.fsPath !== filePath);
        if (originalLength === this.analyzeList.length) {
            //console.log('File not found in the list:', filePath);
        } else {
            //console.log('File removed:', filePath);
            this.refresh();
        }
    }
    
    removeAllFiles() {
        this.analyzeList.clear();
        this.refresh();
        //console.log("Test remove all files clicked")
        console.log(`${this.analyzeList}`)
    }
    
    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            return [...this.analyzeList.values()].map(javaItem => {
                const treeItem = new vscode.TreeItem(path.basename(javaItem.filepath), vscode.TreeItemCollapsibleState.None);
                treeItem.command = {
                    command: 'analyzeFileProvider.removeFile',
                    title: "Remove File",
                    arguments: [javaItem.filepath]  
                };
                treeItem.contextValue = 'analyzableFile';
                treeItem.iconPath = vscode.ThemeIcon.File;
                return treeItem;
            });
        }
        return [];
    }

    async sendFilesForAnalysis() {
        const fileContents = await Promise.all([...this.analyzeList.values()].map(async javaItem => {
            try {
                const content = await readFile(javaItem.filepath);
                return {
                    url: javaItem.filepath,
                    content: content
                };
            } catch (error) {
                console.error(`Error processing file ${javaItem.filepath}: ${error}`);
                throw error;
            }
        }));

        try {
            if (!this.remoteUrl) {
                vscode.window.showErrorMessage('Remote URL is not set.');
                return;
            }

            const results = await analyzeFiles(this.remoteUrl, fileContents);
            results.forEach(result => {
                const javaItem = this.analyzeList.get(result.url);
                console.log(`${result.url}, ${result.difference}`);

                if (javaItem) {
                    javaItem.update(result.density, result.predictedDensity, result.difference);
                }
            });
            this.analysisPreviewProvider.updateFiles(results);
            vscode.window.showInformationMessage('Files successfully sent for analysis.');
            return results;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to send files for analysis: ' + error.message);
        }
    }

}

function registerAnalyzeFileProvider(context, analysisPreviewProvider) {
    const analyzeFileProvider = new AnalyzeFileProvider(analysisPreviewProvider);
    context.subscriptions.push(vscode.window.createTreeView('analyzeFilesView', {
        treeDataProvider: analyzeFileProvider
    }));

    context.subscriptions.push(vscode.commands.registerCommand('analyzeFileProvider.removeFile', (filePath) => {
        if (!filePath) {
            vscode.window.showErrorMessage('File path not provided or incorrect.');
            return;
        }
        console.log("Removing file at path:", filePath.command.arguments[0]); // first element in the argument is the file
        analyzeFileProvider.removeFileFromAnalyze(filePath.command.arguments[0]);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('analyzeFileProvider.sendForAnalysis', async () => {
        const results = await analyzeFileProvider.sendFilesForAnalysis();
        vscode.window.showInformationMessage('Files sent for analysis. Check the console for details.');
        console.log(results);
    }));
    
    return analyzeFileProvider;  
}

module.exports = {
    registerAnalyzeFileProvider
};