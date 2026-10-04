import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export function configured(){return !!(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);}
export async function supabase(){
 if(!configured()) throw new ApiError(503,'Service is not configured. Ask your facilitator to complete .env.local.');
 const jar=await cookies();
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>jar.getAll(),setAll:items=>items.forEach(({name,value,options})=>jar.set(name,value,options))}});
}
export class ApiError extends Error{constructor(public status:number,message:string){super(message);}}
export function dbError(error:{code?:string;message:string}|null){
 if(!error)return;
 const messages:Record<string,[number,string]>={NOT_FOUND:[404,'Product not found. Refresh your inventory.'],INSUFFICIENT_STOCK:[409,'Not enough stock. Reduce the quantity and retry.'],ARCHIVED:[409,'Restore this product before adjusting stock.'],HAS_HISTORY:[409,'This product has movement history. Archive it instead.'],IDEMPOTENCY_CONFLICT:[409,'This request ID was already used for different values. Start a new movement.'],BALANCE_LIMIT:[409,'This movement exceeds the stock limit.'],INVALID_PHOTO:[422,'Photo was not found in your storage. Upload it again.']};
 for(const [code,[status,message]] of Object.entries(messages))if(error.message.includes(code))throw new ApiError(status,message);
 if(error.code==='23505')throw new ApiError(409,'This SKU already exists in your inventory. Choose another SKU.');
 if(['23514','23502','22P02','22003'].includes(error.code||'')||error.message.includes('INVALID')||error.message.includes('USE_MOVEMENT'))throw new ApiError(422,'Invalid values. Check the fields and retry.');
 throw new ApiError(503,'The inventory service could not complete this request. Retry with the same values.');
}
export async function endpoint(req:Request,operation:string,work:(db:Awaited<ReturnType<typeof supabase>>,owner:string)=>Promise<unknown>){
 const requestId=crypto.randomUUID();let status=200;
 try{
 if(req.method!=='GET'&&req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)throw new ApiError(403,'Cross-site request blocked. Open StockLite directly.');
 const db=await supabase();const {data,error}=await db.auth.getUser();
 if(error||!data.user)throw new ApiError(401,'Your session has ended. Sign in again.');
 return Response.json({data:await work(db,data.user.id),request_id:requestId},{headers:{'Cache-Control':'no-store'}});
 }catch(e){status=e instanceof ApiError?e.status:400;return Response.json({error:e instanceof ApiError?e.message:'Check your request and try again.',request_id:requestId},{status,headers:{'Cache-Control':'no-store'}});
 }finally{if(process.env.NODE_ENV==='development')console.info(JSON.stringify({operation,request_id:requestId,outcome:status<400?'success':'failure',status}));}
}
export function defect(){return process.env.NODE_ENV==='development'?process.env.TEACHING_DEFECT||'':'';}
