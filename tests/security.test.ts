import {afterEach,describe,expect,it,vi} from 'vitest';
import {defect,dbError,ApiError} from '../lib/server';
afterEach(()=>vi.unstubAllEnvs());
describe('server safety controls',()=>{
 it('never enables a teaching defect in production',()=>{vi.stubEnv('NODE_ENV','production');vi.stubEnv('TEACHING_DEFECT','storage');expect(defect()).toBe('');});
 it('enables only explicitly selected development exercises',()=>{vi.stubEnv('NODE_ENV','development');vi.stubEnv('TEACHING_DEFECT','preview');expect(defect()).toBe('preview');});
 it('maps stock rejection without leaking raw database diagnostics',()=>{try{dbError({message:'INSUFFICIENT_STOCK secret internal diagnostic'});}catch(e){expect(e).toBeInstanceOf(ApiError);expect((e as ApiError).status).toBe(409);expect((e as Error).message).not.toContain('secret');}});
 it('maps unknown dependency failures to safe retry advice',()=>expect(()=>dbError({message:'private database host details'})).toThrow('The inventory service could not complete this request. Retry with the same values.'));
});
