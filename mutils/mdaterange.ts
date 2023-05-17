import MDate from './mdate';

export interface MDateRange {
    start: MDate,
    end: MDate
}

export function isIn(target:MDateRange, comparison:MDateRange){
    if(target.start.time < comparison.start.time) return false
    if(target.end.time > comparison.end.time) return false
    return true
}

export function isOverwrapped(a:MDateRange, b:MDateRange){
    const t0 = a.start.time - b.end.time
    const t1 = a.end.time - b.start.time
    if(t0 * t1 < 0) return true
    return false
}