import {endpoint,dbError,ApiError} from '@/lib/server';
import {productSchema} from '@/lib/validation';
import {z} from 'zod';
export async function GET(req:Request){return endpoint(req,'products.list',async db=>{
 const {data,error}=await db.from('products').select('*').order('created_at',{ascending:false});dbError(error);
 return await Promise.all((data||[]).map(async p=>{if(!p.image_path)return p;const {data:url,error:e}=await db.storage.from('product-photos').createSignedUrl(p.image_path,300);return {...p,image_url:url?.signedUrl,photo_error:!!e};}));
});}
export async function POST(req:Request){return save(req,null);}
export async function PUT(req:Request){const id=new URL(req.url).searchParams.get('id');return save(req,id||'invalid');}
async function save(req:Request,id:string|null){return endpoint(req,'products.save',async db=>{
 if(id&&!z.uuid().safeParse(id).success)throw new ApiError(422,'Select a valid product.');
 const parsed=productSchema.safeParse(await req.json());if(!parsed.success)throw new ApiError(422,parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '));
 const {data,error}=await db.rpc('save_product',{p_id:id,p_data:parsed.data});dbError(error);return data;
});}
export async function PATCH(req:Request){return endpoint(req,'products.manage',async db=>{
 const parsed=z.object({id:z.uuid(),action:z.enum(['archive','restore','delete'])}).strict().safeParse(await req.json());if(!parsed.success)throw new ApiError(422,'Choose a product and valid action.');
 const {error}=await db.rpc('manage_product',{p_id:parsed.data.id,p_action:parsed.data.action});dbError(error);return {ok:true};
});}
