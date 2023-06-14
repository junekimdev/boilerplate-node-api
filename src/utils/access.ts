import { QueryResultRow } from 'pg';

export interface AccessControlRow extends QueryResultRow {
  name: string;
  readable: boolean;
  writable: boolean;
}
export interface IPermission {
  res_name: string;
  readable: boolean;
  writable: boolean;
}

export const isValidPermit = (permit: any) => {
  const { res_name, readable, writable } = permit;
  return (
    typeof res_name === 'string' && typeof readable === 'boolean' && typeof writable === 'boolean'
  );
};

export const convertToString = (row: AccessControlRow) => {
  if (!row.readable && !row.writable) return;

  let access: string[] = [];
  if (row.readable) access.push(`${row.name}:read`);
  if (row.writable) access.push(`${row.name}:write`);
  return access.join(' ');
};

export const getRow = (name: string, readable = false, writable = false): AccessControlRow => {
  return { name, readable, writable };
};

export const requestAccess = (rows: AccessControlRow[] = []) => {
  // Sort by name in ASC order
  rows.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    throw new Error('duplicated resource name detected in access request'); // names should be unique
  });

  let access: string[] = [];
  rows.forEach((req) => {
    if (req.readable) access.push(`${req.name}:read`);
    if (req.writable) access.push(`${req.name}:write`);
  });
  const str = access.length ? access.join('.*') : '.*';
  return new RegExp(str);
};

export default { convertToString, getRow, requestAccess, isValidPermit };
