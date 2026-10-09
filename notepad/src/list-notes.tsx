import { List, Icon, Action, ActionPanel, Color, useNavigation, getPreferenceValues } from "@vicinae/api";
import { useEffect, useState } from "react";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ViewNote from "./view-note";
import EditNote from "./edit-note";


type noteDir = {
  name: string;
  path: string;
};

type PreviewKind =
  | "image"
  | "text"
  | "pdf"
  | "audio"
  | "video"
  | "unknown";


type Preferences = {
  notesDirectory: string;
};

export default function ListNotes() {
  const { notesDirectory } = getPreferenceValues<Preferences>();
  const [isLoading, setIsLoading] = useState(true)
  const [notes, setNotes] = useState<noteDir[]>();
  const [isShowingDetail, setIsShowingDetail] = useState(true);
  // used for rerending the component on item delete (onTrash), refreshing through useEffect dep
  const [refresh, setRefresh] = useState(false);
  const { push } = useNavigation();
  const [currentPath, setCurrentPath] = useState<string>("");
  const [preview, setPreview] = useState<{
    path: string;
    mime: string;
    kind: PreviewKind;
    content?: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const dirents = await readdir(notesDirectory, {
          withFileTypes: true,
        });
        const files = dirents.filter((entry) => entry.isFile());

        const notesWithTime = await Promise.all(
          files.map(async (entry) => {
            const filePath = path.join(notesDirectory, entry.name);
            const stats = await stat(filePath);

            return {
              name: entry.name,
              path: filePath,
              modifiedTime: stats.mtimeMs,
            };
          }),
        );
        notesWithTime.sort((a, b) => b.modifiedTime - a.modifiedTime);

        setNotes(
          // dirents.filter((a) => !Number(a.isDirectory())).map((entry) => ({
          //   name: entry.name,
          //   path: path.join(notesDirectory, entry.name),
          // })),
          notesWithTime.map(({ name, path }) => ({
            name,
            path,
          })),
        );
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    } load();
  }, [refresh])

  useEffect(() => {

    if (!currentPath) {
      setPreview(null);
      return;
    }

    async function loadPreview() {
      try {
        const mime = await getMimeType(currentPath);
        const kind = getPreviewKind(mime);

        if (kind === "text") {
          const content = await readFile(currentPath, "utf8");

          console.log(preview?.path);
          console.log(currentPath);

          setPreview({
            path: currentPath,
            mime,
            kind,
            content,
          });
          return;
        }

        setPreview({
          path: currentPath,
          mime,
          kind,
          content: 'File is empty:'
        });
      } catch {
        setPreview({
          path: currentPath,
          mime: "unknown",
          kind: "unknown",
        });
      }
    }

    loadPreview();

  }, [currentPath])

  return (
    <List
      isShowingDetail={isShowingDetail}
      isLoading={isLoading}
      onSelectionChange={(id) => setCurrentPath(id)}
    >
      {notes && notes.map((note) => (
        <List.Item
          key={note.name}
          id={note.path}
          title={note.name}
          detail={
            <List.Item.Detail
              markdown={preview?.path === note.path ? `> **${preview.content}**` : undefined}
            />
          }
          actions={
            <ActionPanel>
              <Action icon={Icon.AppWindowGrid3x3} title="View" onAction={() => (push(<ViewNote name={note.name} path={note.path} />))} />
              <Action shortcut={{ modifiers: ['ctrl'], key: 'return' }} icon={{ source: Icon.Text }} title="Edit" onAction={() => (push(<EditNote notePath={note.path} />))} />
              <Action.CopyToClipboard shortcut={{ modifiers: ['ctrl', 'shift'], key: 'c' }} content={preview?.content ? preview.content : ""} />
              <Action shortcut={{ modifiers: ['ctrl'], key: 'e' }} icon={Icon.ArrowRight} title="Toggle detail" onAction={() => setIsShowingDetail(!isShowingDetail)} />
              <Action.Open shortcut={{ modifiers: ['ctrl', 'shift'], key: 'return' }} icon={Icon.BlankDocument} title="Text editor" target={note.path} />
              <Action.OpenWith shortcut={{ modifiers: ['ctrl'], key: 'o' }} icon={Icon.NewDocument} title="Open with" path={note.path} />
              <Action.ShowInFinder shortcut={{ modifiers: ['ctrl', 'shift', 'alt'], key: 'return' }} icon={Icon.Folder} path={note.path} />
              <Action.Trash shortcut={{ modifiers: ['ctrl'], key: 'delete' }} icon={{ source: Icon.DeleteDocument, tintColor: Color.Red }} style={Action.Style.Destructive} title="Delete Note" paths={[note.path]} onTrash={() => setRefresh(!refresh)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}


const execFileAsync = promisify(execFile);

async function getMimeType(filePath: string) {
  const { stdout } = await execFileAsync("file", [
    "--mime-type",
    "--brief",
    filePath,
  ]);

  return stdout.trim();
}

function getPreviewKind(mime: string): PreviewKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("text/")) return "text";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";

  return "unknown";
}

