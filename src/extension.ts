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


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "django-complete-navigate" is now active!');

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
}

// this method is called when your extension is deactivated
export function deactivate() {}
