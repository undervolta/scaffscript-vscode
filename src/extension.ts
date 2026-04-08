import * as vscode from "vscode";
import { join } from "path";
import { fileExists, findPackage } from "./utils";
import { readFile } from "fs/promises";
// import { getScaffConfig } from "./config";


async function resolveCLI() {
	const root = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

	if (!root) return null;

	const bin = join(root, "node_modules", ".bin");

	const candidates = [
		"scaff",
		"scaff.cmd",
		"scaff.exe",
		"scaff.bunx"
	];

	for (const file of candidates) {
		const full = join(bin, file);

		if (await fileExists(full)) {
			return full;
		}
	}

	return null;
}


export async function activate(_context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand(
		"scaffscript.runGenerate", async () => {
			const editor = vscode.window.activeTextEditor;
			const cli = await resolveCLI();

			if (!cli) {
				vscode.window.showErrorMessage("ScaffScript CLI not found. Please run `<package_manager> install` first in your terminal.");
				return;
			}

			if (!editor) {
				vscode.window.showErrorMessage("No active file");
				return;
			}

			if (editor.document.languageId !== "scaffscript") {
				vscode.window.showErrorMessage("Not a ScaffScript file");
				return;
			}

			// const config = await getScaffConfig();
			const filePath = editor.document.fileName.replaceAll("\\", "/").split("/").slice(0, -1).join("/");
			const pkgPath = await findPackage(filePath);
			const generateScript = pkgPath 
				? JSON.parse(
					await readFile(pkgPath, "utf-8"))
					.scripts.generate as string 
				: "";
			const projectPath = generateScript.split(" ")[2];
			
			if (!projectPath) {
				vscode.window.showErrorMessage("GameMaker project not found");
				return;
			}

			const terminal = vscode.window.createTerminal("ScaffScript Runner");

			terminal.show();
			terminal.sendText(`${cli} generate ${projectPath}`);
		}
	);

	_context.subscriptions.push(disposable);
}

export function deactivate() { }
