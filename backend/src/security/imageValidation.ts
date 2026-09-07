const signatures: Record<string, number[][]> = {
 'image/png': [[0x89,0x50,0x4e,0x47]],
 'image/jpeg': [[0xff,0xd8,0xff]],
 'image/webp': [[0x52,0x49,0x46,0x46]]
};

export function validateImageBytes(buffer:ArrayBuffer, mime:string){
 const bytes=new Uint8Array(buffer);
 const allowed=signatures[mime];
 if(!allowed) return false;
 return allowed.some(sig=>sig.every((b,i)=>bytes[i]===b));
}
