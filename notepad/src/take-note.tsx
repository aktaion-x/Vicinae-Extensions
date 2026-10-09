import { getSelectedText } from "@vicinae/api";
import { writeNote } from "./write-note";



export default async function Command() {
    try {
        const selectedText = await getSelectedText();
        console.log(selectedText);       
        if (!selectedText) {
            return;
        }
        await writeNote(`Quick Note - ${new Date().toISOString().slice(0, 19).replace("T", "-")}`, selectedText)
    } catch (error) {
        console.error(error)
    }
}