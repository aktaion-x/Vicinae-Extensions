import { filterEntries, type FilterType } from './file-explorer/filter-entries';
import FilePreview from "./file-explorer/file-preview";
import { List, Action, ActionPanel, Keyboard, useNavigation, Icon, Color } from "@vicinae/api";
import { useEffect, useState } from "react";
import { readdir } from "node:fs/promises";
import os from "node:os";
import { spawn } from "node:child_process";
import path from "node:path";


type Entry = {
    name: string;
    path: string;
    isDirectory: boolean;
};

type ParameterType = {
    dirPath: string;
    showingDetail: boolean
};

export default function Files({ dirPath, showingDetail }: ParameterType) {

    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const currentDirectory = dirPath ?? os.homedir();
    const [filter, setFilter] = useState<FilterType>("all");
    const [currentPath, setCurrentPath] = useState<string>("");
    const [ isShowingDetail, setIsShowingDetail ] = useState(showingDetail ? showingDetail : false);
    const { push } = useNavigation();


    useEffect(() => {

        async function load() {
            try {
                setIsLoading(true);

                const dirents = await readdir(currentDirectory, {
                    withFileTypes: true,
                });

                dirents.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()));

                setEntries(
                    dirents.map((entry) => ({
                        name: entry.name,
                        path: path.join(currentDirectory, entry.name),
                        isDirectory: entry.isDirectory(),
                    })),
                );
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }

        load();
    }, [currentDirectory]);

    const filteredEntries = filterEntries(entries, filter);

    return (
        <List
            isShowingDetail={isShowingDetail}
            isLoading={isLoading}
            navigationTitle={currentDirectory}
            searchBarAccessory={
                <List.Dropdown
                    tooltip="Filter"
                    value={filter}
                    onChange={(value) => setFilter(value as FilterType)}
                >
                    <List.Dropdown.Item title="All" value="all" />
                    <List.Dropdown.Item
                        title="Directories only"
                        value="directories"
                    />
                    <List.Dropdown.Item
                        title="Files only"
                        value="files"
                    />
                </List.Dropdown>
            }
            onSelectionChange={(id) => setCurrentPath(id)}
        >
            {filteredEntries.map((entry) => (
                    <List.Item
                        title={entry.name}
                        key={entry.path}
                        icon={{ fileIcon: entry.path }}
                        id={entry.path}
                        detail={
                            <>
                            
                            {isShowingDetail && currentPath === entry.path && (
                                <FilePreview currentPath={currentPath} />
                            )}
                            </>
                        }
                        actions={
                            <ActionPanel>
                                {entry.isDirectory && (
                                    <>
                                        <Action icon={Icon.AppWindow} shortcut={{modifiers:['alt'], key: 'arrowRight'}} title="Go forward" onAction={() => push(<Files showingDetail={isShowingDetail} dirPath={entry.path} />)} />
                                        <Action icon={Icon.AppWindow} shortcut={{modifiers:['ctrl'], key: 'return'}} title="Open directory in Files" onAction={() => spawn("xdg-open", [entry.path], {detached: true,stdio: "ignore",})} />
                                    </>
                                )}

                                {!entry.isDirectory && (
                                    <>
                                        <Action icon={Icon.AppWindow} title="Open default" onAction={() => { spawn("xdg-open", [entry.path], { detached: true, stdio: "ignore", }).unref();}} />
                                        <Action.OpenWith icon={Icon.AppWindow} shortcut={{modifiers:['ctrl'], key: 'return'}} title="Open file with" path={entry.path} />
                                    </>
                                )}
                                <Action icon={Icon.AppWindow} shortcut={{modifiers:['ctrl', 'shift'], key: 'return'}} title="Open current directory in Files" onAction={() => spawn("xdg-open", [currentDirectory], {detached: true,stdio: "ignore",})} />
                                <Action.CopyToClipboard  shortcut={{modifiers:['ctrl', 'shift'], key: 'c'}} title="Copy path" content={entry.path} />
                                <Action icon={Icon.AppWindow} shortcut={{modifiers:['alt'], key: 'arrowLeft'}} title="Go back" onAction={() => push(<Files dirPath={path.dirname(currentDirectory)} showingDetail={isShowingDetail} />)} />
                                <Action icon={Icon.AppWindow} shortcut={{modifiers:['ctrl'], key: 'e'}} title="Show sidebar" onAction={() => isShowingDetail ? setIsShowingDetail(false) : setIsShowingDetail(true)} />
                                <Action.Trash icon={{ source: Icon.DeleteDocument, tintColor: Color.Red }}  style={Action.Style.Destructive} shortcut={{modifiers:['ctrl', 'shift'], key: 'delete'}} title="Delete" paths={[currentPath]}onTrash={() => (push(<Files dirPath={currentDirectory} showingDetail={isShowingDetail}  />))} />
                            </ActionPanel>
                        }
                    />
            ))}
        </List>
    );
}