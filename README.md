# Log Density Analyzer for Java

## Overview

The Log Density Analyzer is a Visual Studio Code extension that leverages an AI model trained on open-source Java projects. It provides functionalities to predict and check the log density of `.java` files and projects, helping developers understand and optimize their logging practices.

## Features

- **Model Training**: Train the AI model using a collection of open-source Java projects.
- **Log Density Analysis**: Analyze individual Java files to determine the log density in each block of code.
- **Batch Log Density Prediction**: Obtain predicted and current log densities for multiple Java files at once.

## Installation

### Prerequisites

- Docker
- Node.js and npm

### Setting Up the Backend

1. Clone the repository and navigate to the `services` directory.
2. Make sure that services/service_model_creation/install_R.sh and services/preprocess_project/gradlew are saved in LF format and not CRLF (as git might have converted them to, you can do the conversion by visiting the file and clicking CRLF at the bottom right of the VSCode window on the status bar)
2. Run the following command to build and start the backend services using Docker:
   ```bash
   docker compose up --build
   ```
   
### Setting Up the Frontend

1. Navigate to the `logdensitytool` directory.
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Make sure that your vs code IDE is the same version as the one specified in the package.json file. Your VS Code version can be obtained by clicking on **Help** > **About**.
## Usage
After setting up both the backend and frontend, activate the VS Code extension within the Visual 
Studio Code editor to start analyzing your Java projects.

Start by using the `Run Extension` script in **Run & Debung** (Crtl+Shift+D) in the left navigation bar in the Visual Studio.

(`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS), type `Send Github URL`, and enter a GitHub URL to start model training.

- You can use apache zookeeper for testing purposes : [https://github.com/apache/zookeeper](https://github.com/apache/zookeeper)

## Testing
To run the unit and integration tests:
1. Change directory to services/service_ai_analysis or services/service_model_creation.
2. Use the following command:
   ```bash
   pytest
   ```

## Contributing
Contributions are welcome! Please read our contributing (CONTRIBUTING.md) guidelines for details on our code of conduct and the process for submitting pull requests.