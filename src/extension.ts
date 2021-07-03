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


function findAllIndexOfDotInString(str: string) {
	var indices = [];
	for(var i=0; i<str.length;i++) {
		if (str[i] === ".") {
			indices.push(i);
		}
	}
	return indices;
}


function detectObjectInLine(cursorColumn: number, str: string) {
	let splitStr = str.split(".");
	let tmpStr = splitStr[0];
	var object = null;

	for(var i=0; i<splitStr.length; i++) {
		if (tmpStr.length > cursorColumn - 1) {
			console.log("detectObjectInLine: " + object);
			return object;
		}
		tmpStr += '.';
		tmpStr += splitStr[i+1];
		object = splitStr[i];
	}
	console.log("detectObjectInLine: Cannot detect object");
	return null;
}

function findObjectClass() {
	let cursorInfo = getCurrentPositionAndLineContent();
	if (cursorInfo !== null) {
		let object = detectObjectInLine(cursorInfo.column, cursorInfo.text);
		return object;
	}
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

	let jumpToDefinition = vscode.commands.registerCommand("django-complete-navigate.model-objects-jump-to-definition", () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		vscode.window.showInformationMessage('aaaaaaaaaaaaa');

		// openFileAndInsertText("/home/xuananh/Dropbox/Temp/temp.sh", "aaaaa");
		// openFileAtLine("/home/xuananh/Dropbox/Temp/temp.sh", 5);
		// getCurrentPositionAndLineContent();
		findObjectClass();
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
