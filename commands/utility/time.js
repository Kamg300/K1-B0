const moment = require('moment-timezone');
const { timezones } = require('../../config.json');
const format = 'YYYY-MMM-DD hh:mm:ss A';
const format24 = 'YYYY-MMM-DD HH:mm:ss';
const tableImport =  require('table');
const { table } = tableImport;

function getTime(code, time) {
    let key;
    let valid_codes = ""
    let orderedKeys = sortTimezones();

    for (key in orderedKeys) {
        let timezone = orderedKeys[key];
        if (timezones[timezone]["code"] === code.toLowerCase()) {
            let raw = moment().tz(timezones[timezone]["timezone"]);
            let date = raw.format('YYYY-MM-DD') + ' ';
            return moment.tz(date + time, timezones[timezone]["timezone"]);
        }
        valid_codes += timezones[timezone]["code"] + "/";
    }
    throw ("Invalid Timezones. Valid Timezones: " + valid_codes.substr(0, valid_codes.length - 1));
}

function addTimes(hours, minutes, seconds) {
    let key;

    let inTime = "";
    if (hours > 0) { inTime +=  hours + (hours > 1 ? " hours " : " hour "); }
    if (minutes > 0) { inTime +=  hours + (hours > 1 ? " minutes " : " minute "); }
    if (seconds > 0) { inTime +=  hours + (hours > 1 ? " seconds " : " second "); }
    let returnValue = [["Code","Location", "(12h) Time and Date" + (inTime !== "" ? " in " + inTime : ""), "(24h) Time and Date" + (inTime !== "" ? " in " + inTime : "")]];

    let orderedKeys = sortTimezones();

    for (key in orderedKeys) {
        let timezone = orderedKeys[key];
        let raw = moment().tz(timezones[timezone]["timezone"] );
        raw.add(hours, 'hour');
        raw.add(minutes, 'minute');
        raw.add(seconds, 'second');
        returnValue.push([timezones[timezone]["code"],timezone, raw.format(format), raw.format(format24)]);
    }
    return returnValue;
}

function formatTimes(time, atTime) {
    let key;
    let returnValue = [["Code", "Location", "(12h) Time and Date at " + atTime, "(24h) Time and Date at " + atTime]];
    let orderedKeys = sortTimezones();

    for (key in orderedKeys) {
        let timezone = orderedKeys[key];
        returnValue.push([timezones[timezone]["code"],timezone, time.tz(timezones[timezone]["timezone"]).format(format),time.tz(timezones[timezone]["timezone"]).format(format24)]);
    }
    return returnValue;
}

function sortTimezones() {
    let sortedTimezones = {};

    let timezone;

    for (timezone in timezones) {
        sortedTimezones[timezone] = moment().tz(timezones[timezone]["timezone"]).utcOffset();
    }

    let items = Object.keys(sortedTimezones).map(function(key) {
        return [key, sortedTimezones[key]];
    });

    items.sort(function(first, second) {
        return first[1] - second[1];
    });

    sortedTimezones = [];

    for (timezone in items) {
       sortedTimezones.push(items[timezone][0])
    }

    return sortedTimezones;
}

module.exports = {
    name: "time",
    // The Category of the command (Used for help)
    category: "utility",
    description: "Displays the current time in a given timezone",
    aliases: ['current-time', 'ct'],
    usage: '[hours] [minutes] [seconds] or time [timezone] [24hr Time]',
    args: false,
    execute(message, args) {
        let parse = false;


        if (args.length) { parse = isNaN(parseInt(args[0])); }

        if (args.length > 1 && parse) {
            let toTime = args[1];
            if (!isNaN(Number(args[1]))) { toTime = toTime.length === 3 ? "0" + toTime.slice(0,1) + ":" + toTime.slice(1,4) : toTime.slice(0,2) + ":" + toTime.slice(2,4); }
            let time;
            try {
                time = getTime(args[0].toLowerCase(), toTime)
            } catch (err) {
                return message.reply(err);
            }

            return message.channel.send("```" +
                `\n`
                + table(formatTimes(time, toTime))
                + "```");
        }

        let hours = 0; let minutes = 0; let seconds = 0;
        if (args.length && !parse) { hours = parseInt(args[0]); }
        if (args.length > 1 && !parse) { minutes = parseInt(args[1]); }
        if (args.length > 2 && !parse) { seconds = parseInt(args[2]); }

        let msg = "```\n" + table(addTimes(hours,minutes,seconds)) + "```";
        return message.channel.send(msg);
    },
};