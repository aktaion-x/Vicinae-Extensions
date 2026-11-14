
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const exec = promisify(execFile);

