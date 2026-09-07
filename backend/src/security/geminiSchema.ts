export type GeminiPrediction = {
 foodName:string;
 confidence:number;
 nutrition:Record<string, unknown>;
 classification?:string;
 healthBenefits?:string[];
 warnings?:string[];
 suggestions?:string[];
 explanation?:string;
};

export function validateGeminiPrediction(value:unknown): value is GeminiPrediction{
 const v=value as GeminiPrediction;
 return !!v && typeof v.foodName==='string' && typeof v.confidence==='number' && !!v.nutrition && typeof v.nutrition==='object';
}
