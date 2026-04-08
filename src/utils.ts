import { access, constants } from "fs/promises";
import { join, dirname } from "path";


export async function fileExists(path: string): Promise<boolean> {
    try {
        await access(path, constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

export async function findPackage(fileDir: string) {
    let dir = fileDir;

    while (true) {
        const full = join(dir, "package.json");

        if (await fileExists(full)) {
            return full;
        }

        const parent = dirname(dir);

        if (parent === dir) {
            return null; 		// reached filesystem root
        }

        dir = parent;
    }
}
