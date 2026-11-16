import {
  Action,
  ActionPanel,
  closeMainWindow,
  Icon,
  List,
  showToast,
  Toast,
  environment,
} from "@vicinae/api";
import { useEffect, useState } from "react";
// import { addWorkspace, getCurrentWorkspace, getWorkspaces, goToWorkspace, Workspace, removeWorkspace } from "./utils";
import { getWorkspaces, addWorkspace, deleteWorkspace, focusWindow, getCurrentWorkspace, getWindowIcon, goToWorkspace, moveWindow, removeWorkspace, Workspace } from "./utils-hyprland";


export default function SimpleList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<null | number>(null);
  const [refresh, setRefresh] = useState(false);
  const [isShowingDetail, setIsShowingDetail] = useState(false);

  useEffect(() => {
    (async () => {
      // Get focused application
      const currentWorkspace = await getCurrentWorkspace();
      setCurrentWorkspace(currentWorkspace);

      const workspaces = await getWorkspaces();
      setWorkspaces(workspaces);

    })()

  }, [refresh])
  return (
    <List
      searchBarPlaceholder="Search workspaces..."
      isShowingDetail={isShowingDetail}
    >
      {workspaces.map((w) => {
        const iconsArray = w.windows.map((window) => window.iconPath).map(i => (i ? { icon: i } : { icon: `${environment.assetsPath}/app-window.svg` }));;
        return (<List.Item
          title={w.name}
          key={w.id}
          subtitle={w.windowCount ? `${w.windowCount} window(s)` : 'empty'} active={w.id === currentWorkspace}
          icon={Icon.AppWindowGrid3x3}
          accessories={iconsArray}
          detail={
            <List.Item.Detail markdown={`${w.windows.map(window => {
              return `<img src="${window.iconPath || `${environment.assetsPath}/app-window.svg`}" width="16" height="16" /> - ${window.title}\n\n`;
            }).join('')}`} />
          }
          actions={
            <ActionPanel>
              <Action title="Switch to workspace" onAction={async () => {
                try {
                  goToWorkspace(w.id);
                  setRefresh((prev) => !prev);
                  closeMainWindow();
                } catch (error) {
                  setRefresh((prev) => !prev);
                  showToast({
                    title: "Operation failed",
                    message: error instanceof Error ? error.message : String(error),
                    style: Toast.Style.Failure,
                  });
                }
              }} />
              <Action title="Add new workspace" shortcut={{ modifiers: ['ctrl'], key: 't' }} onAction={async () => {
                try {
                  addWorkspace();
                  setRefresh((prev) => !prev);
                  showToast({ title: "workspace added", message: "workspace added", style: Toast.Style.Success })
                } catch (error) {
                  setRefresh((prev) => !prev);
                  showToast({
                    title: "Operation failed",
                    message: error instanceof Error ? error.message : String(error),
                    style: Toast.Style.Failure,
                  });
                }
              }} />
              <Action title={`${isShowingDetail ? 'Hide' : 'Show'} details`} onAction={() => setIsShowingDetail(prev => !prev)} shortcut={{ modifiers: ['ctrl'], key: 'e' }} />
              <Action title="Delete last workspace" icon={Icon.Trash} style="destructive" shortcut={{ modifiers: ['ctrl'], key: 'w' }} onAction={async () => {
                try {
                  await removeWorkspace(w.id);
                  setRefresh((prev) => !prev);
                  showToast({ title: "workspace deleted", message: "workspace deleted", style: Toast.Style.Failure })
                } catch (error) {
                  setRefresh((prev) => !prev);
                  showToast({
                    title: "Operation failed",
                    message: error instanceof Error ? error.message : String(error),
                    style: Toast.Style.Failure,
                  });
                }
              }} />
            </ActionPanel>
          } />
        )
      })}
    </List>
  );
}

