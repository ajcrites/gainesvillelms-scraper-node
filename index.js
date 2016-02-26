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
        data: querystring.stringify(Object.assign({key}, require("./request.json"))),
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
