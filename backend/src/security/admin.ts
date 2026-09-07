export function isConfiguredAdmin(email:string|undefined, configured?:string){
 if(!email) return false;
 return (configured??'').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}

export function requireAdmin(email:string|undefined, configured?:string){
 return isConfiguredAdmin(email, configured);
}
