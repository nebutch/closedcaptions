"use strict";

import React from "react";
import reactStamp from "react-stamp";

import Group from "../stamps/group";
import Size from "../stamps/size";
import Align from "../stamps/align";
import WebVTTParser from "./webvttparser";

import PropTypes from "prop-types";
import "./captioning.scss";

let captionsParser;

export const Captioning = reactStamp(React).compose(
    Group,
    {
        displayName: "Captioning",
        defaultProps: {
            subtitleFile: "",
            viewPortWidth: 1280
        },
        propTypes: {
            captions: PropTypes.string,
            currentTime: PropTypes.number,
            captionsEnabled: PropTypes.bool
        },
        state: {
            currentTime: 0,
            currentCaption: "",
            captionsEnabled: true
        },
        componentWillUnmount: function() {
            if (captionsParser) {
                captionsParser.deinitParser();
            }

            this.clearCaptions();
        },
        componentWillReceiveProps: function(props) {
            const captionsEnabled = this.props.captionsEnabled || false;
            if (this.state.captionsEnabled !== captionsEnabled) {
                this.setState({ captionsEnabled: captionsEnabled });
            }
            if (this.state.currentTime !== props.currentTime) {
                this.setState({ currentTime: props.currentTime });
                if (!!captionsParser && this.state.captionsEnabled) {
                    let caption =
                        captionsParser.getCurrentCaption(this.state.currentTime, this.props.closedCaptionStyles) || "";
                    this.setState({ nextCaption: caption });
                } else {
                    this.clearCaptions();
                }
            }
        },
        componentDidUpdate: function(props) {
            const { viewPortWidth } = this.props;
            const { nextCaption, currentCaption } = this.state;
            if (nextCaption !== currentCaption) {
                let left = 0;
                if (nextCaption) {
                    const halfWidth = this.nextCaption.firstChild.getClientRects()[0].width / 2;
                    left = (viewPortWidth/2) - halfWidth;

                }
                this.setState({ currentCaption: nextCaption || "", left });
            }
        },
        clearCaptions: function() {
            this.setState({ currentCaption: null });
        },
        componentDidMount: function() {
            const opts = {
                subtitleBlob: this.props.captions
            };
            captionsParser = new WebVTTParser(opts);
        },
        render: function() {
            const { currentCaption, nextCaption } = this.state;
            return (
                <div id="roku-captions" className="roku-captions-container" style={{ left: this.state.left || 0}}>
                    <span style={{visibility: "hidden"}} ref={nextCaption => (this.nextCaption = nextCaption)}>
                    {nextCaption}
                    </span>
                    {currentCaption}
                </div>
            );
        }
    }
);
