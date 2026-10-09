import { Action, ActionPanel, useNavigation, Form, showToast, Toast, getPreferenceValues } from "@vicinae/api";
import ListNotes from "./list-notes";
import { writeNote } from "./write-note";

export default function CreateNote() {
    const { push } = useNavigation();
    const submitHandler = async ({ note, title }: any) => {
        // console.log({title, note});
        try {
            if (!note) {
                await showToast({ title: 'Note is empty', style: Toast.Style.Failure })
                return;
            }
            await writeNote(title, note);
            await showToast({ title: 'Note is saved', style: Toast.Style.Success })
            push(<ListNotes />);
        } catch (error) {
            console.error('error:', error)
        }
        console.log('form has been submited');
    }
    return (
        <Form
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
                placeholder="Note Title..."
            />
            <Form.TextArea
                id="note"
                title="Note"
                placeholder="Write your note in Markdown..."
            />
        </Form>
    );
}