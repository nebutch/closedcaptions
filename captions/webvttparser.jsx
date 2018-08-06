"use strict";

import CaptionsParser from "./captionsparser";

class WebVTTParser extends CaptionsParser {
    parseCaptions(webvttString) {
        let webvtt,
            len,
            nodes = [],
            subs = {
                captions: []
            };
        try {
            webvtt = webvttString.split("\n");
        } catch (e) {
            console.error("Error parsing subtitles file! \nError : " + e.message);
            return;
        }

        if (webvtt.length) {
            let header,
                timing,
                begin,
                end,
                node,
                nodeDelim = "",
                timeDelim = " --> ",
                commentIdentifier = "NOTE",
                index = 0,
                specChars = [
                    { check: "â™ª", repl: "♪" },
                    { check: "{\\\an1}", repl: "" },
                    { check: "{\\\an2}", repl: "" },
                    { check: "{\\\an3}", repl: "" },
                    { check: "{\\\an4}", repl: "" },
                    { check: "{\\\an5}", repl: "" },
                    { check: "{\\\an6}", repl: "" },
                    { check: "{\\\an7}", repl: "" },
                    { check: "{\\\an8}", repl: "" },
                    { check: "{\\\an9}", repl: "" }
                ],
                timeRegex = /([\d+:|\.|,?]+) --> ([\d+:|\.|,?]+)/;

            if (webvtt[0].indexOf("WEBVTT") > -1) {
                header = webvtt.shift();
            }
            len = webvtt.length;

            for (let line of webvtt) {
                line = line.trim();

                // Line is a comment
                if (line.indexOf(commentIdentifier) > -1) {
                    console.log("This is a comment");
                }

                // First line of a caption region
                if (line !== nodeDelim && !isNaN(line)) {
                    if (!node) {
                        node = { id: line, content: [] };
                    }
                }

                timing = line.match(timeRegex);

                if (timing) {
                    if (!node) {
                        node = { id: null, content: [] };
                    }
                    begin = timing[1];
                    end = timing[2];
                    node.begin = this.parseTime(begin);
                    node.end = this.parseTime(end);
                    node.options = this.getCueOptions(line, timing);
                }

                // Line is caption text
                if (
                    !!node &&
                    isNaN(line) &&
                    line !== nodeDelim &&
                    line.indexOf(timeDelim) < 0 &&
                    line.indexOf(commentIdentifier) < 0
                ) {
                    for (let char of specChars) {
                        if (line.indexOf(char.check) > -1) {
                            let re = new RegExp(char.check, "g");
                            line = line.replace(re, char.repl);

                            // Replace stubborn .srt artifact tags, where exist
                            line = line.replace(char.check, char.repl);
                        }
                    }
                    node.content.push(this.strip(line));
                }

                // No more caption text in the current region
                // Push captions to nodes array
                if ((line === nodeDelim && !!node) || (!!node && index === len - 1)) {
                    let duration = node.end - node.begin;
                    nodes.push({
                        id: node.id,
                        begin: node.begin,
                        end: node.end,
                        content: node.content,
                        options: node.options,
                        dur: duration
                    });
                    node = null;
                }

                index++;
            }
        }

        this.parsedCaptions = nodes;
    }

    strip(html) {
        let text = new DOMParser().parseFromString(html, "text/html");
        return text.body.textContent || "";
    }

    getCueOptions(line, timing) {
        let options = null,
            lineOptions = line
                .substr(timing[0].length)
                .trim()
                .split(" ");

        if (lineOptions && lineOptions.length) {
            options = {};
            lineOptions.forEach(item => {
                let itemArray = item.split(":"),
                    key = itemArray[0],
                    value = itemArray[1];
                options[key] = value;
            });
        }

        return options;
    }

    parseTime(timeString) {
        const INTEGER = 1;
        const FLOAT = 2;
        const UNIT = 3;
        const HOUR = 1;
        const MINUTE = 2;
        const SECOND = 3;
        const MILLISECOND = 4;

        let format1 = /(\d+):(\d+):(\d+)[\.|:|,](\d+)/, // eg. 00:00:13.231 HOUR/MINUTE/SECOND/MS
            format2 = /(\d+):(\d+)[\.|:|,](\d+)/, // eg. 00:19.166 MINUTE/SECOND/MS
            format3 = /(\d+)\.(\d+)(\w+)/i, // eg. 34.7s
            format1Res,
            format2Res,
            format3Res,
            i,
            f,
            u,
            h,
            m,
            s,
            ms,
            res = -1;

        if (timeString) {
            format1Res = timeString.match(format1);

            if (format1Res) {
                h = parseInt(format1Res[HOUR], 10);
                m = parseInt(format1Res[MINUTE], 10);
                s = parseInt(format1Res[SECOND], 10);
                ms = parseInt(format1Res[MILLISECOND], 10);

                if (h > 0 || m > 0 || s > 0 || ms > 0) {
                    res = 0;

                    if (h > 0) {
                        res += h * 60 * 60 * 1000;
                    }

                    if (m > 0) {
                        res += m * 60 * 1000;
                    }

                    if (s > 0) {
                        res += s * 1000;
                    }

                    if (ms > 0) {
                        res += ms;
                    }
                }
            } else {
                format2Res = timeString.match(format2);

                if (format2Res) {
                    m = parseInt(format2Res[MINUTE - 1], 10);
                    s = parseInt(format2Res[SECOND - 1], 10);
                    ms = parseInt(format2Res[MILLISECOND - 1], 10);

                    if (m > 0 || s > 0 || ms > 0) {
                        res = 0;

                        if (m > 0) {
                            res += m * 60 * 1000;
                        }

                        if (s > 0) {
                            res += s * 1000;
                        }

                        if (ms > 0) {
                            res += ms;
                        }
                    }
                } else {
                    format3Res = timeString.match(format3);

                    if (format3Res) {
                        i = parseInt(format3Res[INTEGER], 10);
                        f = parseInt(format3Res[FLOAT], 10);
                        u = format3Res[UNIT];

                        switch (true) {
                            case u === "ms":
                                res = i;
                                break;
                            case u === "s":
                                res = i * 1000;
                                res += f;
                                break;
                            case u === "m":
                                res = i * 60 * 1000;
                                res += f * 1000;
                                break;
                            case u === "h":
                                res = i * 60 * 60 * 1000;
                                res += f * 60 * 1000;
                        }
                    }
                }
            }
        }

        return res;
    }
}

export default WebVTTParser;
