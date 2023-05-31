import { QueryResultRow } from 'pg';

export interface AccessControlResultRow extends QueryResultRow {
  name: string;
  writable: boolean;
  readable: boolean;
}

export const convertToString = (row: AccessControlResultRow) => {
  if (!row.readable && !row.writable) return;

  let str = row.name;
  if (row.readable && !row.writable) str += ':read'; // read-only
  if (!row.readable && row.writable) str += ':write'; // write-only
  return str;
};

export const isReadable = (accessString: string, resource: string) => {
  const accesses = accessString.split(' ');
  for (let i = 0; i < accesses.length; i++) {
    const access = accesses[i];
    if (access.startsWith(resource) && !access.endsWith(':write')) return true;
  }
  return false;
};

export const isWritable = (accessString: string, resource: string) => {
  const accesses = accessString.split(' ');
  for (let i = 0; i < accesses.length; i++) {
    const access = accesses[i];
    if (access.startsWith(resource) && !access.endsWith(':read')) return true;
  }
  return false;
};

export default { convertToString, isReadable, isWritable };
