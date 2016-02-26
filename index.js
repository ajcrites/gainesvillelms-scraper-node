'use strict';

const querystring = require("querystring");
const request = require("request");
const htmlparser = require("htmlparser2");
const key = "52633f4973cf845e55b18c8e22ab08d5";
const searchHost = "http://www.gainesvillemls.com";

let inListing = false;
let mlsNext = false;
let foundMls = false;

const parser = new htmlparser.Parser({
    onopentag(name, attribs) {
        if ("table" === name && "listings" === attribs.class) {
            inListing = true;
        }
        if (inListing && "span" === name && "mls" === attribs.class) {
            inListing = false;
            mlsNext = true;
        }
    },
    ontext(text) {
        if (mlsNext) {
            mlsNext = false;
            foundMls = text;
        }
        if (foundMls) {
            if (/, fl/i.test(text)) {
                // Matches a Gainesville address, so we are intersted
                // in this mls
                if (/gainesville, fl/i.test(text)) {
                    checkMlsDetails(foundMls);
                }
                else {
                    foundMls = false;
                }
            }
        }
    },
});

request.post(`${searchHost}/gan/idx/search.php`).form(
    querystring.stringify(Object.assign({key}, require("./request.json")))
).on("data", data => parser.write(data)).on("end", () => parser.end());

function checkMlsDetails(mls) {
    let foundConstructionLabel = false;
    let foundConstructionSpan = false;
    let hasBlockConstruction = false;

    let foundParkingLabel = false;
    let foundParkingSpan = false;
    let hasGarageParking = true;

    const parser = new htmlparser.Parser({
        onopentag(name) {
            // span that follows the construction label
            if (foundConstructionLabel && "span" === name) {
                foundConstructionLabel = false;
                foundConstructionSpan = true;
            }

            // span that follows the parking label
            if (foundParkingLabel && "span" === name) {
                foundParkingLabel = false;
                foundParkingSpan = true;
            }
        },

        ontext(text) {
            if ("Construction-exterior:" === text) {
                foundConstructionLabel = true;
            }
            if (foundConstructionSpan) {
                foundConstructionSpan = false;
                if (/block/i.test(text)) {
                    hasBlockConstruction = true;
                }
            }

            if ("Parking:" === text) {
                foundParkingLabel = true;
            }
            if (foundParkingSpan) {
                foundParkingSpan = false;
                if (/no garage/i.test(text)) {
                    hasGarageParking = false;
                }
            }
        },

        onend() {
            if (hasBlockConstruction && hasGarageParking) {
                console.log(`${searchHost}/gan/idx/index.php?%s`, querystring.stringify({key, mls}));
            }
        }
    });

    request.post(`${searchHost}/gan/idx/detail.php`).form(
        querystring.stringify({key, mls, gallery: "false", custom: ""})
    ).on("data", data => parser.write(data)).on("end", () => parser.end());
}
