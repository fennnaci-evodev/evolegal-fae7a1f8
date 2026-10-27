import { extractDocumentText } from "./documentParser";
/** Local viewing is independent of Hugo's smaller message/attachment limits. */
export const CONTRACT_VIEWER_FILE_BYTES = 22 * 1024 * 1024;

export async function readContractViewerFile(file: File): Promise<string> {
  return (await extractDocumentText(file, CONTRACT_VIEWER_FILE_BYTES)).text;
}
