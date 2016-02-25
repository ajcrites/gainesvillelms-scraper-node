const Promise = require("bluebird");
const co = require("co");
const axios = require("axios");
const querystring = require("querystring");
const jsdom = require("jsdom");
const key = "52633f4973cf845e55b18c8e22ab08d5";

co(function* () {
    const searchHost = "http://www.gainesvillemls.com";

    let responseBody = yield axios({
        url: `${searchHost}/gan/idx/search.php`,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data: querystring.stringify({
            LM_MST_prop_fmtYNNT: "1",
            LM_MST_prop_cdYYNT: "1,9,10,11,12,13,14",
            LM_MST_mls_noYYNT: "",
            // Minimum Price
            LM_MST_list_prcYNNB: "",
            // Maximum Price
            LM_MST_list_prcYNNE: "175000",
            "LM_MST_prop_cdYNNL[]": "9",
            // Minimum Square Footage
            LM_MST_sqft_nYNNB: "",
            // Maximum Square Footage
            LM_MST_sqft_nYNNE: "",
            // Minimum Year Built
            LM_MST_yr_bltYNNB: "",
            // Maximum Year Built
            LM_MST_yr_bltYNNE: "",
            // Minimum Bedrooms
            LM_MST_bdrmsYNNB: "3",
            // Maximum Bedrooms
            LM_MST_bdrmsYNNE: "",
            // Minimum Bathrooms
            LM_MST_bathsYNNB: "2",
            // Maximum Bathrooms
            LM_MST_bathsYNNE: "",
            LM_MST_hbathYNNB: "",
            LM_MST_hbathYNNE: "",
            // County
            "LM_MST_countyYNCL[]": "ALA",
            LM_MST_str_noY1CS: "",
            LM_MST_str_namY1VZ: "",
            LM_MST_remarksY1VZ: "",
            openHouseStartDt_B: "",
            openHouseStartDt_E: "",
            ve_info: "",
            ve_rgns: "1",
            LM_MST_LATXX6I: "",
            poi: "",
            count: "1",
            key,
            isLink: "0",
            custom: "",
        }),
    });

    let dfd = Promise.defer();
    jsdom.env({
        html: responseBody.data,
        done: (err, window) => dfd.resolve(window)
    });
    let window = yield dfd.promise;

    Array.prototype.forEach.call(window.document.querySelectorAll("table.listings"), elem => co(function* () {
        if (/gainesville, fl/i.test(elem.querySelector("tr:nth-of-type(3)").textContent)) {
            const mls = elem.querySelector("span.mls").textContent;
            let responseBody = yield axios({
                url: `${searchHost}/gan/idx/detail.php`,
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data: querystring.stringify({
                    key,
                    mls,
                    gallery: "false",
                    custom: "",
                }),
            });

            let dfd = Promise.defer();
            jsdom.env({
                html: responseBody.data,
                done: (err, window) => dfd.resolve(window)
            });
            let detailsWindow = yield dfd.promise;
            let hasParking = true;
            let hasBlock = false;

            Array.prototype.forEach.call(detailsWindow.document.querySelectorAll("table.wide label.bold"), elem => {
                if ("Parking:" === elem.textContent && /no garage/i.test(elem.parentElement.querySelector("span").textContent)) {
                    hasParking = false;
                }
                if ("Construction-exterior:" === elem.textContent && /block/i.test(elem.parentElement.querySelector("span").textContent)) {
                    hasBlock = true;
                }
            });
            if (hasParking && hasBlock) {
                console.log(`${searchHost}/gan/idx/index.php?key=${key}&mls=${mls}`);
            }
        }
    }));
}).catch(err => console.error(err));
