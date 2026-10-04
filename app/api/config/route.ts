import {configured,defect,supabase} from '@/lib/server';
export async function GET(){let email:string|null=null;if(configured()){try{const db=await supabase();const {data}=await db.auth.getUser();email=data.user?.email||null;}catch{}}return Response.json({data:{configured:configured(),email,defect:defect()}},{headers:{'Cache-Control':'no-store'}});}
