import { Action, ActionPanel, useNavigation, Form, showToast, Toast } from "@vicinae/api";
import ListNotes from "./list-notes";
import { useEffect, useState } from "react";
import { readFile } from "node:fs/promises";
import { writeNote } from "./write-note";
import path from "node:path";

type parameterType = {
    notePath: string
}

export default function EditNote({notePath}: parameterType) {
    const {push} = useNavigation();
    const [isLoading, setIsLoading] = useState(true)
    const [title, setTitle] = useState<string>("");
    const [note, setNote] = useState<string>("");

    useEffect(() => {
        async function load() {
            try {
                setIsLoading(true);
                const content = await readFile(notePath, "utf8");
                setTitle(path.basename(notePath))
                setNote(content)
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        } load();
    }, [notePath])

    
    const submitHandler = async ({ note, title }: any) => {
        try {
            if (!note) {
                await showToast({ title: 'Note is empty', style: Toast.Style.Failure })
                return;
            }
            await writeNote(title, note, notePath);
            await showToast({ title: 'Note is saved', style: Toast.Style.Success })
            push(<ListNotes />);
        } catch (error) {
            console.error('error:',error)
        }
        console.log('form has been submited');
    }


    return (
        <Form
            isLoading={isLoading}
            navigationTitle="Add note"
            enableDrafts
            actions={
                <ActionPanel>
                    <Action.SubmitForm title="Add note" onSubmit={submitHandler} />
                </ActionPanel>
            }
        >
            <Form.TextField
                id="title"
                title="Title"
                defaultValue={title}
                placeholder="Note Title..."
            />
            <Form.TextArea
                id="note"
                title="Note"
                defaultValue={note}
                placeholder="Write your note in Markdown..."
            />
        </Form>
    );
}