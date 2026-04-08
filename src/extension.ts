import * as vscode from "vscode";
import { join, dirname } from "path";
import { fileExists, findPackage } from "./utils";
import { readFile } from "fs/promises";
// import { getScaffConfig } from "./config";


async function resolveCLI(filePath: string) {
	if (!filePath) return null;

	let current = filePath;
	const candidates = [
		"scaff",
		"scaff.cmd",
		"scaff.exe",
		"scaff.bunx"
	];

	while (true) {
		const binDir = join(current, "node_modules", ".bin");

		for (const file of candidates) {
			const full = join(binDir, file);

			if (await fileExists(full)) {
				return full;
			}
		}

		const parent = dirname(current);

		if (parent === current) {
			return null;
		}

		current = parent;
	}
}


export async function activate(_context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand(
		"scaffscript.runGenerate", async () => {
			const editor = vscode.window.activeTextEditor;

			if (editor?.document.languageId !== "scaffscript") {
				vscode.window.showErrorMessage("Not a ScaffScript file");
				return;
			}

			const filePath = editor.document.fileName.replaceAll("\\", "/").split("/").slice(0, -1).join("/");
			const cli = await resolveCLI(filePath);

			if (!cli) {
				vscode.window.showErrorMessage("ScaffScript CLI not found. Please run `<package_manager> install` first in your terminal.");
				return;
			}

			if (!editor) {
				vscode.window.showErrorMessage("No active file");
				return;
			}

			// const config = await getScaffConfig();
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
