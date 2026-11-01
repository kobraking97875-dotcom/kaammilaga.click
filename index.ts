// Supabase Edge Function: partnership-review
// Deploy from Supabase Dashboard > Edge Functions; configure secrets privately.
// Required: RESEND_API_KEY, RESEND_FROM_EMAIL (a verified sending domain).
// Required by runtime: SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.
// Never put Resend API keys or service-role key in public HTML.
import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins=new Set(['https://kaammilaga.click','https://www.kaammilaga.click']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const goodPath=(id:string,p:string)=>p.startsWith(id+'/')&&
  /^[0-9a-f-]{36}\/(photo|aadhaar|pan|qualification|extra)\.(jpg|jpeg|png|webp|pdf)$/i.test(p);

Deno.serve(async req=>{
  const requestOrigin=req.headers.get('origin');
  const cors={
    'Access-Control-Allow-Origin':requestOrigin&&allowedOrigins.has(requestOrigin)?requestOrigin:'https://kaammilaga.click',
    'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Content-Type':'application/json; charset=utf-8', 'Vary':'Origin'
  };
  const reply=(payload:unknown,status=200)=>new Response(JSON.stringify(payload),{status,headers:cors});
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return reply({error:'POST required'},405);
  if(requestOrigin && !allowedOrigins.has(requestOrigin))return reply({error:'Origin not allowed'},403);
  try{
  const url=Deno.env.get('SUPABASE_URL');
  const anon=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||Deno.env.get('KM_SUPABASE_SECRET_KEY');
  if(!url||!anon||!secret)return reply({error:'Missing Supabase server secrets'},503);
  const bearer=req.headers.get('authorization')||'';
  if(!bearer.startsWith('Bearer '))return reply({error:'Owner login required'},401);
  const token=bearer.slice(7);
  const caller=createClient(url,anon,{global:{headers:{Authorization:bearer}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:ud,error:ue}=await caller.auth.getUser(token);
  if(ue||!ud.user?.id)return reply({error:'Invalid owner session'},401);
  const {data:allowed,error:ae}=await caller.rpc('km_is_partnership_owner');
  if(ae||allowed!==true)return reply({error:'Owner permission required'},403);
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  let body;
  try{body=await req.json()}catch{return reply({error:'Invalid JSON'},400)}
  // Match the payload used by both the current and older Owner Panel versions.
  // Reject unknown actions; only a verified owner can reach this code.
  const details=(body && typeof body==='object' && !Array.isArray(body))?body:{};
  const nested=(details.application && typeof details.application==='object')?details.application:{};
  const id=String(details.id ?? details.application_id ?? details.applicationId ?? details.tracking_id ?? details.trackingId ?? nested.id ?? '').trim();
  const rawAction=String(details.action ?? details.review_action ?? details.reviewAction ?? details.status ?? '').trim().toLowerCase();
  const actionAliases:Record<string,string>={
    approve:'approved',approval:'approved',approved:'approved',
    reject:'rejected',rejected:'rejected',
    cleanup:'rejected',retry_cleanup:'rejected',cleanup_rejected:'rejected',
    retry_proof_cleanup:'rejected',delete_rejected:'rejected',
    needs_information:'needs_information',request_info:'needs_information',
    needs_info:'needs_information',request_information:'needs_information'
  };
  const action=rawAction==='diagnose'?'diagnose':(actionAliases[rawAction] || '');
  const trace=crypto.randomUUID();
  // Safe diagnostics: never log the applicant UUID, documents, JWT, or email.
  const diagnostic={
    trace,
    received_keys:Object.keys(details).filter(k=>
      ['id','application_id','applicationId','tracking_id','trackingId','action','status','client_version'].includes(k)
    ).slice(0,10),
    id_length:id.length,
    uuid_valid:uuid.test(id),
    client_version:String(details.client_version||'not_provided').slice(0,64)
  };
  if(!uuid.test(id)){
    console.warn('Review request rejected: application UUID missing or invalid.',diagnostic);
    return reply({error:'Invalid application ID. Expected the full tracking/application UUID.',code:'INVALID_APPLICATION_ID',diagnostic},400);
  }
  if(!action){
    console.warn('Review request rejected: unsupported action',rawAction.slice(0,45));
    return reply({error:'Invalid review action. Accepted actions: approved, rejected, needs_information.',code:'INVALID_REVIEW_ACTION',diagnostic},400);
  }
  const {data:application,error:fetchError}=await admin.from('partnership_applications').select('*').eq('id',id).maybeSingle();
  if(fetchError)return reply({error:'Could not load application: '+fetchError.message},500);
  if(!application)return reply({error:'Application not found or already deleted',code:'APPLICATION_NOT_FOUND',diagnostic},404);
  // Read-only connectivity check. It must never approve, reject or delete files.
  if(action==='diagnose')return reply({ok:true,found:true,diagnostic});
  if(action==='needs_information'){
    const {error}=await admin.from('partnership_applications').update({status:'needs_information',reviewed_at:new Date().toISOString(),reviewed_by:ud.user.id}).eq('id',id);
    if(error)return reply({error:error.message},500);
    return reply({ok:true,status:'needs_information'});
  }
  if(action==='rejected'){
    if(application.status!=='rejected'){
      const {error}=await admin.from('partnership_applications').update({status:'rejected',reviewed_at:new Date().toISOString(),reviewed_by:ud.user.id}).eq('id',id);
      if(error)return reply({error:'Could not reject: '+error.message},500);
    }
    // Storage API removal, not direct DELETE from storage.objects.
    const proofValues=Object.values(application.proof_paths||{});
    // Never delete the database row when we cannot safely identify every
    // uploaded proof: that could leave private identity documents orphaned.
    if(proofValues.some(v=>typeof v!=='string'||!goodPath(id,v))){
      return reply({error:'One or more proof paths have an unexpected format. Cleanup stopped to avoid leaving orphaned identity documents; check Edge Function logs and storage.',code:'INVALID_PROOF_PATH'},409);
    }
    const paths=proofValues as string[];
    if(paths.length){
      const {error}=await admin.storage.from('partnership-proofs').remove(paths);
      if(error)return reply({error:'Application rejected but proof cleanup failed. Retry cleanup: '+error.message},503);
    }
    // SQL AFTER DELETE trigger retains only hashed email + rejected tracking state.
    const {data:deleted,error:deleteError}=await admin.from('partnership_applications').delete().eq('id',id).select('id');
    if(deleteError||!deleted?.length)return reply({error:'Proofs removed but database cleanup failed. Retry: '+(deleteError?.message||'0 rows')},503);
    return reply({ok:true,status:'rejected',deleted:true});
  }

  const apiKey=Deno.env.get('RESEND_API_KEY');const from=Deno.env.get('RESEND_FROM_EMAIL');
  if(!apiKey||!from)return reply({error:'Approval email service is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL before approving.'},503);
  // Do not send duplicate approvals for previously emailed applications.
  if(application.approval_email_sent_at)return reply({ok:true,status:'approved',email_sent:true,already_sent:true});
  if(application.status!=='approved'){
    const {error}=await admin.from('partnership_applications').update({status:'approved',reviewed_at:new Date().toISOString(),reviewed_by:ud.user.id}).eq('id',id);
    if(error)return reply({error:'Could not approve: '+error.message},500);
  }
  const applicantName=String(application.full_name||'Applicant').slice(0,90).replace(/[<>]/g,'');
  const message=`Namaste ${applicantName},\n\nAapki KaamMilega partnership application ko initial approval mil gaya hai.\n\nHamari team agle 24–48 ghanton mein aapki registered email ID par aapse sampark karegi.\n\nTracking ID: ${id}\nStatus check: https://kaammilaga.click/partnership.html#track\n\nFinal partnership / authority, fee terms aur responsibilities alag written agreement aur required verification ke baad hi effective hongi.\n\nRegards,\nKaamMilega Team`;
  let sent=false;let mailId='';let errText='';
  try{
    const mail=await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':'km-partner-approval-'+id},
      body:JSON.stringify({from,to:[String(application.email)],subject:'KaamMilega Partnership — Application Approved',text:message})
    });
    const result=await mail.json().catch(()=>({}));
    if(!mail.ok)throw Error(result?.message||('Email API returned '+mail.status));
    mailId=String(result?.id||'');sent=true;
  }catch(e){errText=String(e instanceof Error?e.message:e).slice(0,500);}
  const {error:saveError}=await admin.from('partnership_applications').update({
    approval_email_sent_at:sent?new Date().toISOString():null,
    approval_email_id:sent?mailId:null,
    approval_email_error:sent?null:errText
  }).eq('id',id);
  if(saveError)return reply({error:'Approval applied, but email delivery logging failed: '+saveError.message,email_sent:sent},503);
  if(!sent)return reply({error:'Application approved but email NOT sent: '+errText+'. Configure email provider and retry.'},503);
  return reply({ok:true,status:'approved',email_sent:true,email_id:mailId});
  }catch(error){
    console.error('partnership-review unexpected error:',error);
    return reply({error:'Server error in partnership-review. Check Edge Function logs.'},500);
  }
});
