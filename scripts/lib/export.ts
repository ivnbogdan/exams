/** Readers and types for the exams.ro export folder (docs/PLAN.md section 4). */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ExportAttachmentStatus =
  | "present"
  | "present_renamed"
  | "missing_on_server"
  | "on_disk_no_db_row";

export interface ExportAttachment {
  db_name: string | null;
  local_path: string | null;
  status: ExportAttachmentStatus;
  size: number | null;
}

export interface ExportSubject {
  id: string;
  profesor: string | null;
  materie: string | null;
  data: string | null;
  content: string | null;
  user: string | null;
  serie: string | null;
  grupa: string | null;
  facultate: string | null;
  institutie: string | null;
  data_an: string | null;
  sesiune: string | null;
  uid: string | null;
  anonim: string | null;
  attachments: ExportAttachment[];
}

export interface ExportCourse {
  id: string;
  id_parinte: string;
  nume: string;
  an: string;
}

export interface ExportFaculty {
  id: string;
  nume: string;
  id_parinte: string;
}

/** Row of attachments.csv; only the extra on-disk files are used from it. */
export interface ExportCsvAttachment {
  subject_id: string;
  db_name: string;
  local_path: string;
  status: ExportAttachmentStatus;
  size: string;
}

export interface ExportData {
  dir: string;
  subjects: ExportSubject[];
  courses: ExportCourse[];
  faculties: ExportFaculty[];
  extraFiles: ExportCsvAttachment[];
}

/** Minimal RFC 4180 parser: handles quoted fields, doubled quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function loadExport(dir: string): ExportData {
  const need = (p: string) => {
    const full = join(dir, p);
    if (!existsSync(full)) throw new Error(`Export file missing: ${full}`);
    return full;
  };
  const subjects = JSON.parse(readFileSync(need("subjects_with_attachments.json"), "utf8")) as ExportSubject[];
  const courses = JSON.parse(readFileSync(need("tables/materie.json"), "utf8")) as ExportCourse[];
  const faculties = JSON.parse(readFileSync(need("tables/facultate.json"), "utf8")) as ExportFaculty[];
  const csv = parseCsv(readFileSync(need("attachments.csv"), "utf8"));
  const [header, ...body] = csv;
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`attachments.csv has no column ${name}`);
    return i;
  };
  const iSubject = col("subject_id");
  const iDbName = col("db_name");
  const iLocal = col("local_path");
  const iStatus = col("status");
  const iSize = col("size");
  const extraFiles = body
    .filter((r) => r.length >= header.length && r[iStatus] === "on_disk_no_db_row")
    .map((r) => ({
      subject_id: r[iSubject],
      db_name: r[iDbName],
      local_path: r[iLocal],
      status: r[iStatus] as ExportAttachmentStatus,
      size: r[iSize],
    }));
  return { dir, subjects, courses, faculties, extraFiles };
}
