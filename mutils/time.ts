export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export async function sleep(second:number){
    return new Promise(resolve=>setTimeout(resolve, second*1000))
}