import { Action, ActionPanel, List, useNavigation } from "@vicinae/api";
import OSInformation from "./device-information/os-info";
import CpuInformation from "./device-information/cpu-info";
import MemoryInformation from "./device-information/memory-info";
import DiskInformation from "./device-information/disk-info";
import NetworkInformation from "./device-information/network-info";
import VersionsInformation from "./device-information/versions-info";
import FilesystemInformation from "./device-information/filesystem-info";
import AudioInformation from "./device-information/audio-info";
import UsbInformation from "./device-information/usb-info";
import TimeInformation from "./device-information/time-info";
import PcInformation from "./device-information/pc-info";

export default function SystemInformation() {
    const {push} = useNavigation();
            console.log('from system information');
    return (
        <List>
            <List.Item title='PC Information' actions={
                <ActionPanel><Action title='go to PC Information' onAction={() => push(<PcInformation />)} /></ActionPanel>
            } />
            <List.Item title='OS Information' actions={
                <ActionPanel><Action title='go to OS Information' onAction={() => push(<OSInformation />)} /></ActionPanel>
            } />
            <List.Item title='CPU Information' actions={
                <ActionPanel><Action title='go to CPU Information' onAction={() => push(<CpuInformation />)} /></ActionPanel>
            } />
            <List.Item title='RAM Information' actions={
                <ActionPanel><Action title='go to RAM Information' onAction={() => push(<MemoryInformation />)} /></ActionPanel>
            } />
            <List.Item title='Disk Information' actions={
                <ActionPanel><Action title='go to Disk Information' onAction={() => push(<DiskInformation />)} /></ActionPanel>
            } />
            <List.Item title='Network Information' actions={
                <ActionPanel><Action title='go to Network Information' onAction={() => push(<NetworkInformation />)} /></ActionPanel>
            } />
            <List.Item title='Filesystem Information' actions={
                <ActionPanel><Action title='go to Filesystem Information' onAction={() => push(<FilesystemInformation />)} /></ActionPanel>
            } />
            <List.Item title='Versions Information' actions={
                <ActionPanel><Action title='go to Versions Information' onAction={() => push(<VersionsInformation />)} /></ActionPanel>
            } />
            <List.Item title='Audio Information' actions={
                <ActionPanel><Action title='go to Audio Information' onAction={() => push(<AudioInformation />)} /></ActionPanel>
            } />
            <List.Item title='USB Information' actions={
                <ActionPanel><Action title='go to USB Information' onAction={() => push(<UsbInformation />)} /></ActionPanel>
            } />
            <List.Item title='Time Information' actions={
                <ActionPanel><Action title='go to Time Information' onAction={() => push(<TimeInformation />)} /></ActionPanel>
            } />
        </List>
    )
}