// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


function openFileAndInsertText(filePath: string, insertString: string) {
	// reference: https://stackoverflow.com/a/39183552/7639845
	var setting: vscode.Uri = vscode.Uri.parse(filePath);
	vscode.workspace.openTextDocument(setting).then((a: vscode.TextDocument) => {
		vscode.window.showTextDocument(a, 1, false).then(e => {
			e.edit(edit => {
				edit.insert(new vscode.Position(0, 0), insertString);
			});
		});
	}, (error: any) => {
		console.error(error);
		debugger;
	});
}


function openFileAtLine(filePath: string, lineNumber: number) {
	// reference: https://stackoverflow.com/a/39183552/7639845
	var setting: vscode.Uri = vscode.Uri.parse(filePath);
	vscode.workspace.openTextDocument(setting).then((a: vscode.TextDocument) => {
		vscode.window.showTextDocument(a, 1, false).then(editor => {
			// https://github.com/Microsoft/vscode/issues/6695#issuecomment-221146568
			let range = editor.document.lineAt(lineNumber-1).range;
			editor.selection =  new vscode.Selection(range.start, range.end);
			editor.revealRange(range);
		});
	}, (error: any) => {
		console.error(error);
		debugger;
	});
}


function getCurrentPositionAndLineContent() {
	// https://stackoverflow.com/a/49889203/7639845
	// https://gist.github.com/moshfeu/6f61dfb8e1f5e20320ba359501e2c96c/revisions
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const {text} = activeEditor.document.lineAt(activeEditor.selection.active.line);
		const cursorLine = activeEditor.selection.active.line;
		const cursorColumn = activeEditor.selection.active.character;
		var yourMessage = `Current cursor [line,column]=[${cursorLine + 1},${cursorColumn}] have content: ${text}`;
		console.log('getCurrentPositionAndLineContent: ' + yourMessage);
		return {
			line: cursorLine,
			column: cursorColumn,
			text: text
		};
	}
	console.log("getCurrentPositionAndLineContent: Cannot get cursor");
	return null;
}


function getObjectAndItPropertyInCurrentLine(cursorColumn: number, str: string) {
	let splitStr = str.split(".");
	let tmpStr = splitStr[0];
	let object = null;
	let property = null;

	for(var i=0; i<splitStr.length; i++) {
		if (tmpStr.length > cursorColumn - 1) {
			console.log(`getObjectAndItPropertyInCurrentLine: object.property: ${object}.${property}`);
			if (property !== null && property.includes('(')) {	// remove () in object.property()
				property = property.split('(')[0];
			}
			return {
				objectName: object,
				property: property
			};;
		}
		tmpStr += '.';
		tmpStr += splitStr[i+1];
		property = splitStr[i+1];
		object = splitStr[i];
	}
	console.log("getObjectAndItPropertyInCurrentLine: Cannot detect object");
	return {
		objectName: null,
		property: null
	};
}


function parsePythonFile(fileName: string, tabLength: number) {
	var lines = require('fs').readFileSync(fileName, 'utf-8')
		.split('\n');
		// .filter(Boolean);	// add this code to ignore empty lines

	// console.log(lines);
	const parsedContent: {[index: string]:any} = {};

	let className = null;
	for (let i in lines) {
		// console.log(lines[i].slice(0, 4));
		// class
		let line = lines[i];
		let realLine = Number(i) + 1;
		if (line.startsWith('class ')) {
			
			let classDeclare = line.slice('class '.length, line.length);
			if (classDeclare.includes('(')) {
				className = classDeclare.split('(')[0];
			} else {
				className = classDeclare.slice(0, classDeclare.length-1);
			}
			parsedContent[className] = {
				line: Number(i) + 1,
				properties: {}
			};
		}

		// attributes or methods
		if (!(line.startsWith(' '.repeat(tabLength*2)))) {
			// console.log(line);

			// method
			if (line.includes('def ') && className !== null) {
				// console.log(line);
				let method = line.split('def ')[1].split('(')[0];
				parsedContent[className].properties[method] = realLine;
			}

			// attributes
			if (line.includes(' = ')) {
				// console.log(line);
				let attribute = line.slice(tabLength).split(' = ')[0];
				parsedContent[className].properties[attribute] = realLine;
			}
		}
	}
	// console.log(parsedContent);
	return parsedContent;
}


function findPositionWhereObjectIsAssigned(object: string, cursorLine: number) {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		for (let i = cursorLine; i > 0; i--) {
			let textLine = activeEditor.document.lineAt(i).text;
			if (textLine.startsWith(object + ' = ')) {
				console.log(`object : ${object} was assign at line ${i}: ${textLine}`);
				return {
					line: i,
					text: textLine
				};
			}
			if (textLine.startsWith('def')) {break;}
		}
	}
	return null;
}


function getClassAndProperty() {
	let cursorInfo = getCurrentPositionAndLineContent();
	if (cursorInfo !== null) {
		let objectInfo = getObjectAndItPropertyInCurrentLine(cursorInfo.column, cursorInfo.text);
		if (objectInfo.objectName !== null && objectInfo.property !== null) {
			let positionInfo = findPositionWhereObjectIsAssigned(objectInfo.objectName, cursorInfo.line);
			if (positionInfo !== null) {
				let objectClass = positionInfo.text.split(' = ')[1].split('.')[0];
				console.log(`getClassAndProperty: object'class: ${objectClass}`);
				return {
					className: objectClass,
					classProperty: objectInfo.property
				};
			}
		}
	}
	console.log(`getClassAndProperty: object'class: null`);
	return {
		className: null,
		classProperty: null
	};;
}


function getAllPythonFileInWorkspace() {
	var fileProcessCount = 0;
	// let includePattern = '**/*.py';
	// let excludePattern = '**/.venv/**';

	if (vscode.workspace.workspaceFolders !== undefined) {
		let includePattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0].uri, `{**/models.py,**/models/*.py}`);
		let excludePattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0].uri, `{**/__init__.py,**/.venv/*}`);

		vscode.workspace.findFiles(includePattern, excludePattern).then(files => {
			console.log(`Total files to parse: ${files.length}`);
			fileProcessCount = files.length;
			let filePaths: string[] = [];
			files.forEach(file => { filePaths.push(file.fsPath); });
			console.log(filePaths);
			return filePaths;
		});
	}
	return [];
}


function doJumpToDefinition() {
	let classInfo = getClassAndProperty();
	if (classInfo.className !== null && classInfo.classProperty !== null) {
		
		let pythonFiles = getAllPythonFileInWorkspace();
		pythonFiles.forEach(function(fileName){
			console.log(fileName);
			let tabLength = 4;
			let parsedContent = parsePythonFile(fileName, tabLength);
			
			for (let key in parsedContent) {
				if (key === classInfo.className) {
					console.log(parsedContent[key]);
					for (let k in parsedContent[key].properties) {
						if (k === classInfo.classProperty) {
							let line = parsedContent[key].properties[k];
							openFileAtLine(fileName, line);
							return;
						}
					}
				}
			}
		});
	}
	return;
}


function getAllPythonFileInWorkspaceAndJumpToDefinition() {
	var fileProcessCount = 0;
	// let includePattern = '**/*.py';
	// let excludePattern = '**/.venv/**';
	let classInfo = getClassAndProperty();
	if (vscode.workspace.workspaceFolders !== undefined && classInfo.className !== null && classInfo.classProperty !== null) {
		let includePattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0].uri, `{**/models.py,**/models/*.py}`);
		let excludePattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0].uri, `{**/__init__.py,**/.venv/*}`);

		vscode.workspace.findFiles(includePattern, excludePattern).then(files => {
			console.log(`Total files to parse: ${files.length}`);
			fileProcessCount = files.length;
			files.forEach(file => { 
				let tabLength = 4;
				let parsedContent = parsePythonFile(file.fsPath, tabLength);
			
				for (let key in parsedContent) {
					if (key === classInfo.className) {
						for (let k in parsedContent[key].properties) {
							if (k === classInfo.classProperty) {
								let line = parsedContent[key].properties[k];
								openFileAtLine(file.fsPath, line);
								return;
							}
						}
					}
				}
			});
			console.log('DONE');
			return ;
		});
	}
	return;
}

class GoDefinitionProvider implements vscode.DefinitionProvider {
	// https://code.visualstudio.com/api/language-extensions/programmatic-language-features#show-definitions-of-a-symbol

    public provideDefinition(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        Thenable<vscode.Definition>{
			console.log('------------------------ 1 this is my provider definition');

			// https://stackoverflow.com/a/46054953/7639845

            // return new Promise((resolve, reject) =>{
            //     let definitions:vscode.Definition = [];         
            //     for (let i = 0; i < document.lineCount; i++) {
            //         let eachLine = document.lineAt(i).text.toLowerCase().trim();
            //         if (eachLine.startsWith("cursor")) {                    
            //             definitions.push({
            //                 uri: document.uri,
            //                 range: document.lineAt(i).range
            //             });                     
            //         }                   
            //     } 

            //     resolve(definitions);
            // });

			// https://stackoverflow.com/a/58972720/7639845

			return new Promise((resolve, reject) =>{
				const range = document.getWordRangeAtPosition(position);
				const selectedWord = document.getText(range);
				console.log('----------------------- 2 ' + selectedWord);
				let definitions:vscode.Definition = [];         
				for (let i = 0; i < document.lineCount; i++) {
					let eachLine = document.lineAt(i).text.toLowerCase().trim();
					if (eachLine.startsWith("def")) { 
						if (eachLine.includes(selectedWord)) {//only selectedWord                  
							definitions.push({
								uri: document.uri,
								range: document.lineAt(i).range
							}); 
						}
					}                   
				} 
				resolve(definitions);
			});

    }
}


function doRegisterHoverProvider() {
	// https://github.com/ShPelles/vscode-hover-demo
	const disposable = vscode.languages.registerHoverProvider(['python', 'markdown', 'plaintext'], {
		provideHover(document, position, token) {
			const range = document.getWordRangeAtPosition(position);
			const text = document.getText(range);
			const count = document.getText().match(new RegExp(text, 'g'))?.length;
			return {
				contents: [`xuananh's hover: **${text}** - ${count} times in this document`],
				range
			};
		}
	});
}


function runPythonCode() {
	const pythonShell = require('python-shell').PythonShell;
	console.log('Running python code ------------------------');
	pythonShell.run('/home/xuananh/repo/vscode-ext-django-complete-navigate/src/my_script.py', null, function (err: string) {
		if (err) {
			console.error(err);
		}
		console.log('finished');
	});
}

function runPythonCodeWithArgsAndOption() {
	// https://stackoverflow.com/a/47866721/7639845
	const pythonShell = require('python-shell').PythonShell;

	var options = {
		mode: 'text',
		pythonPath: '/home/xuananh/repo/python-note/.venv/bin/python',
		pythonOptions: ['-u'],
		scriptPath: '/home/xuananh/repo/vscode-ext-django-complete-navigate/src',
		args: ['value1', 'value2', 'value3']
	};

	pythonShell.run('my_script1.py', options, function (err: string, results: string[]) {
		if (err) {
			// throw err;
			console.error(err);
		}
		// Results is an array consisting of messages collected during execution
		console.log('results: ', results);
	});
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "django-complete-navigate" is now active!');

	doRegisterHoverProvider();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('django-complete-navigate.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from django-complete-navigate!');
	});

	// let disposable1 = vscode.commands.registerCommand('extension.removeConsoleLogs', async () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	const files = await vscode.workspace.findFiles('**.*.*', '**/node_modules/**');

	// 	vscode.window.showInformationMessage('number of files',files.length.toString());
	// 	files.forEach(file => {
	// 		vscode.window.showInformationMessage('Hello VS Code!!!!!');

	// 	});
	// 	// Display a message box to the user

	// });

	let jumpToDefinition = vscode.commands.registerCommand("django-complete-navigate.model-objects-jump-to-definition", () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		vscode.window.showInformationMessage('aaaaaaaaaaaaa');

		// openFileAndInsertText("/home/xuananh/Dropbox/Temp/temp.sh", "aaaaa");
		// openFileAtLine("/home/xuananh/Dropbox/Temp/temp.sh", 5);
		// getCurrentPositionAndLineContent();
		// getClassAndProperty();
		// getClassAndPropertyInfo('');
		// getAllPythonFileInWorkspace();
		// parsePythonFile('/home/xuananh/Dropbox/Temp/temp.py', 4);
		// doJumpToDefinition();
		// getAllPythonFileInWorkspaceAndJumpToDefinition();
		// runPythonCode();
		runPythonCodeWithArgsAndOption();
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(jumpToDefinition);
	context.subscriptions.push(vscode.languages.registerDefinitionProvider(
        {language: "python"}, new GoDefinitionProvider() ));

	context.subscriptions.push(vscode.languages.registerCompletionItemProvider (
		// https://stackoverflow.com/a/64593598/7639845
		// { language: 'json', scheme: 'file' },
		'python',
		{
		  // eslint-disable-next-line no-unused-vars
		  provideCompletionItems(document, position, token, context) {
			let myItem = (text: string) => {
			  let item = new vscode.CompletionItem(text, vscode.CompletionItemKind.Text);
			  item.range = new vscode.Range(position, position);
			  item.detail = 'xuananh suggest';
			  return item;
			};
			return [
			  myItem('howdy1'),
			  myItem('howdy2'),
			  myItem('howdy3'),
			];
		  }
		},
		'.' // NOTE: trigger auto complete by '.' character
	  ));

}

// this method is called when your extension is deactivated
export function deactivate() {}
