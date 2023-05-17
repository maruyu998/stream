export const timezones = ["Asia/Tokyo"] as const
export type timezone = typeof timezones[number]

type Year = `${number}${number}${number}${number}`;
type Month = 1|2|3|4|5|6|7|8|9|10|11|12;
type Day = `0${1|2|3|4|5|6|7|8|9}`| `${1|2}${number}`|`30`|`31`;
export type DateString = `${Year}-${Month}-${Day}`;