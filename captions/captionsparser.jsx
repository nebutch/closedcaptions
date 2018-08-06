"use strict";

import React from "react";
import { Label } from "../label/label";

class CaptionsParser {
    constructor(opts) {
        this._subtitleFileUrl = opts.subtitleFileUrl || null;
        this._subtitleBlob = opts.subtitleBlob || null;
        this._currentCaption = null;
        this._captions = null;

        console.log("CaptionsParser :: @constructor");

        if (!this._subtitleBlob && !this._subtitleFileUrl) {
            console.error("Required parameters are missing");
            return;
        }

        this._initParser();
    }

    /**
     * Public - Can be overriden if required
     */
    deinitParser() {
        console.log("CaptionsParser :: deinitParser");
    }

    getCurrentCaption(time, CSStyles) {
        time++;
        time *= 1000; // Convert to MS
        let caption = {
            caption: this._getCaptionsAtTimePoint(time),
            styles: this._getCaptionStyles(),
            CSStyles
        };

        return this._getUpdatedCaption(caption);
    }

    /**
     * Private - should not be overridden
     */
    _getCaptionStyles() {
        // TODO - Define defaults in global context?
        let styles = {
            color: "yellow",
            size: "16px",
            background: "black",
            font: "sans-serif"
        };

        return styles;
    }

    _initParser() {
        console.log("CaptionsParser :: _initParser");

        if (!!this._subtitleFileUrl) {
            this._loadSubtitleFile().then(result => this.parseCaptions(result));
        } else if (!!this._subtitleBlob) {
            this.parseCaptions(this._subtitleBlob);
        }
    }

    _loadSubtitleFile() {
        const testFile =
            "https://edge.roku-vod.top.comcast.net/2700879181/static/nosec/Roku/180/209/KARATEKIDTHE1984_1984_185_2997_MPEG2_US_ENG_3846581_HD_15735877670_srt_en-US_6.srt";

        console.log("CaptionsParser :: _loadSubitleFile");
        const promise = new Promise((resolve, reject) => {
            // TODO: Add the loading logic here
        });

        return promise;
    }

    _getUpdatedCaption(caption) {
        let block,
            children = [];

        if (caption && caption.caption && caption.caption.content && caption.caption.content.length) {
            const lineStyles = {
                fontSize: caption.styles.size,
                color: caption.styles.color,
                fontFamily: caption.styles.font
            };
            const { backgroundColor, ...labelStyles } = caption.CSStyles;
            children = caption.caption.content.map(line => (
                <p style={lineStyles}>
                    <Label className="captions" {...labelStyles} style={{ display: block, textAlign: "center"}}>
                        <span style={{backgroundColor: `rgba(${backgroundColor})`}}>{line}</span>
                    </Label>
                </p>
            ));
            block = <div className="roku-captions">{children}</div>;
        }

        this._currentCaption = block;
        return block;
    }

    _clearCaption() {
        console.log("CaptionsParser :: _clearCaption");
        this._currentCaption = null;
    }

    _getCaptionsAtTimePoint(time) {
        let capt;

        if (this._captions) {
            this._captions.some(cap => {
                if (time >= cap.begin && time < cap.end) {
                    capt = cap;
                    return;
                } else if (time > cap.end) {
                    return;
                }
            });
        }

        return capt;
    }

    _optimizeCaptions(caps) {
        let optimized = caps;

        // TODO - Create captions dictionary for better optimizatino

        return optimized;
    }

    setParsedCaptions(value) {
        console.log("CaptionsParser :: setParsedCaptions");
        this._captions = value;
    }

    /**
     * Abstract - must be implemented by subclass
     */
    parseCaptions(result) {
        console.error("Error! Abstract function called!");
    }

    /**
     * Getters/Setters
     */

    get currentCaption() {
        return this._currentCaption;
    }

    set parsedCaptions(value) {
        this._captions = this._optimizeCaptions(value);
    }

    get parsedCaptions() {
        return this._captions;
    }

    get subtitleFileUrl() {
        return this._subtitleFileUrl;
    }

    get subtitleBlob() {
        return this._subtitleBlob;
    }

    get videoPlayer() {
        return this._videoPlayer;
    }
}

export default CaptionsParser;
