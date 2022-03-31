//import {} from './types';
import { jwt } from '../../utils';

const provider = async (userId: number, email: string) =>
  jwt.sign({ user_id: userId }, email);

export default provider;
