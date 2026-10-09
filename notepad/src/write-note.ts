import { writeFile, unlink } from 'fs/promises';
import { getPreferenceValues } from "@vicinae/api";


export async function writeNote( title: string, note: string, removedFile?: string ) {
    const { notesDirectory } = getPreferenceValues();
    try {
        if (removedFile) {
            await unlink(removedFile);
        }
        await writeFile(`${notesDirectory}/${title}`, note, "utf8");
    } catch (error) {
        console.error({error});
    }

}
