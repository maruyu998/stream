import moment from 'moment-timezone';

const timezones = {
    'Asia/Tokyo': 9
}
export type Unit = "year"|"month"|"day"|"hour"|"minute"|"second"|"millisecond";
const JapaneseLongDOWs = ["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"]
const JapaneseMediumDOWs = ["日曜","月曜","火曜","水曜","木曜","金曜","土曜"]
const JapaneseShortDOWs = ["日","月","火","水","木","金","土"]
const LongDOWs = ["Sunday", "Monday", "Tueday", "Wedday", "Thuday", "Friday", "Satday"]
const MediumDOWs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const ShortDOWs = ["S", "M", "T", "W", "T", "F", "S"]

function getJapaneseShortDOW(date:Date):string{
    return JapaneseShortDOWs[date.getDay()]
}
function getJapaneseMediumDOW(date:Date):string{
    return JapaneseMediumDOWs[date.getDay()]
}
function getJapaneseLongDOW(date:Date):string{
    return JapaneseLongDOWs[date.getDay()]
}
function getShortDOW(date:Date):string{
    return ShortDOWs[date.getDay()]
}
function getLongDOW(date:Date):string{
    return LongDOWs[date.getDay()]
}
function zeroFill(num:number, digits:number): string{
    return ( Array(digits).join('0') + num ).slice( -digits );
}

export default class MDate {
    time: number = 0;

    constructor(time?:number){
        if(time!==undefined){
            this.time = time
        }else{
            const d = new Date()
            this.time = d.getTime()
        }
    }
    static parse(text:string, timezone?:number|string, format?:string): MDate{
        if(timezone && format){
            // timezone section is ignored in text
            return this.parseFormat(text, format)
        }else if(timezone && !format){
            throw Error("not implemented!")
        }else if (!timezone && format){
            console.error({text, timezone, format})
            throw Error("not implemented!")
        }else{
            const date = new Date(Date.parse(text))
            return new MDate(date.getTime())
        }
    }
    static parseFormat(text:string, format:string):MDate{
        const date = new Date(0)
        function findNumber(text:string, format:string, partstr:string){
            const index = format.indexOf(partstr)
            return index < 0 ? 0 : Number(text.slice(index, index+partstr.length))
        }
        date.setFullYear(findNumber(text, format, "YYYY"))
        date.setMonth(findNumber(text, format, "MM") - 1)
        date.setDate(findNumber(text, format, "DD"))
        date.setHours(findNumber(text, format, "hh"))
        date.setMinutes(findNumber(text, format, "mm"))
        date.setSeconds(findNumber(text, format, "ss"))
        date.setMilliseconds(findNumber(text, format, "SSS"))
        const time = date.getTime()
        const mdate = new MDate(time)
        return mdate
    }
    toDate(){
        const date = new Date()
        date.setTime(this.time)
        return date
    }
    toMoment(timezone:string){
        return moment(this.time).tz(timezone)
    }
    toISOString(){
        return this.toDate().toISOString()
    }
    getDateString(timezone:string){
        return this.format("YYYY-MM-DD",timezone)
    }
    getDaySecond(timezone:string):number{
        const z = moment(this.time).tz(timezone).set('hour',0).set('minute',0).set('second',0).set('millisecond',0)
        return (this.time - z.valueOf()) / 1000
    }
    format(format?:string, timezone?:string): string{
        if(format && timezone)
            return moment(this.time).tz(timezone).format(format)
        if(format && !timezone)
            return moment(this.time).format(format)
        if(!format && timezone)
            return moment(this.time).tz(timezone).format()
        if(!format && !timezone)
            return moment(this.time).format()
        throw Error("unexpected")
    }
    getResetTime(timezone:string): MDate{
        const m = moment(this.time).tz(timezone)
            .set('hour',0).set('minute',0).set('second',0).set('millisecond',0)
        return new MDate(m.valueOf())
    }
    add(diff:number, unit:Unit): MDate{
        return new MDate(moment(this.time).add(diff,unit).valueOf())
    }
    static now(): MDate{
        return new MDate((new Date()).getTime())
    }
    isToday(timezone:string):boolean{
        const start = MDate.now().getResetTime(timezone).time
        const end = MDate.now().getResetTime(timezone).add(1,'day').time
        return (start <= this.time && this.time < end)
    }
    getMediumDOW(timezone:string):string{
        return MediumDOWs[this.toMoment(timezone).day()]
    }
    static getDiff(a:MDate, b:MDate, unit:Unit): number {
        let diff = b.time - a.time
        if(unit == 'millisecond') return diff
        diff /= 1000
        if(unit == 'second') return diff
        diff /= 60
        if(unit == 'minute') return diff
        diff /= 60
        if(unit == 'hour') return diff
        diff /= 24
        if(unit == 'day') return diff
        throw Error("not implemented")
    }
    getTimeRatio(timezone:string):number{
        return this.getDaySecond(timezone) / (24 * 60 * 60)
    }
    toString():string{
        return `MDate: time=${this.time}, format=${this.toDate().toLocaleString()}`
    }
}