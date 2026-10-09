import { Action, useNavigation, ActionPanel, Detail, Color, Icon } from "@vicinae/api";
import { useEffect, useState } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import EditNote from "./edit-note";
import ListNotes from "./list-notes";


type parameterType = {
    path: string;
    name: string;
};

export default function ViewNote({ path: filePath }: parameterType) {
    const [note, setNote] = useState<string>("");
    const { push } = useNavigation()


    useEffect(() => {
        async function load() {
            try {
                const content = await readFile(filePath, "utf8");
                setNote(content)
            } catch (error) {
                console.error(error);
            }
        } load();
    }, [path])


    return (
<Detail
navigationTitle={path.basename(filePath)}
  markdown={
    note === null
      ? "## Loading…\n\nPlease wait."
      : `> **${note}**`
  }
  actions={
    <ActionPanel>
        <Action icon={{source: Icon.EditShape}} title="Edit" onAction={() => (push(<EditNote notePath={filePath} />))} />
        <Action.Trash icon={{ source: Icon.DeleteDocument, tintColor: Color.Red }}  style={Action.Style.Destructive} title="Delete Note" paths={[filePath]} onTrash={() => (push(<ListNotes />))} />

    </ActionPanel>
  }
/>
    );
}
