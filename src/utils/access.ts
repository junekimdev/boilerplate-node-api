import { QueryResultRow } from 'pg';

export interface AccessControlResultRow extends QueryResultRow {
  name: string;
  writable: boolean;
  readable: boolean;
}

export const convertToString = (row: AccessControlResultRow) => {
  if (!row.readable && !row.writable) return;

  let access = [];
  if (row.readable) access.push(`${row.name}:read`);
  if (row.writable) access.push(`${row.name}:write`);
  return access.join(' ');
};

export default { convertToString };
