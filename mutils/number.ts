function* range_between(start:number, end:number){
  for(let i=start; i<end; i++) yield i;
  return null;
}

function* range_to(end:number){
  for(let i=0; i<end; i++) yield i;
  return null;
}

export function range(a:number, b:number|null=null){
  if(b === null) return range_to(a)
  else return range_between(a,b)
}

export function sum(array:Array<number>){
  return array.reduce((pre,e)=>pre+e, 0)
}

export function mean(nums:number[]):number{
  return sum(nums) / nums.length
}

export function round(number:number, digit:number):number{
  return Math.round(number / (10**digit)) * (10**digit)
}