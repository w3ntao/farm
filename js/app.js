function preprocessStrike(text) {
    const STRIKE_ON = "__SGR_STRIKE_ON__";
    const STRIKE_OFF = "__SGR_STRIKE_OFF__";

    return text.replace(/\x1b\[([0-9;]*)m/g, (match, params) => {
        if (!params) return match;

        const codes = params.split(";").map(Number);

        const hasStrikeOn = codes.includes(9);
        const hasStrikeOff = codes.includes(29);
        const hasReset = codes.includes(0);
        const remaining = codes.filter(c => c !== 9 && c !== 29);

        let rebuilt = "";

        if (remaining.length > 0) {
            rebuilt += `\x1b[${remaining.join(";")}m`;
        }

        if (hasReset || hasStrikeOff) {
            rebuilt += STRIKE_OFF;
        }

        if (hasStrikeOn) {
            rebuilt += STRIKE_ON;
        }

        return rebuilt;
    });
}

function renderAnsi(text) {
    const STRIKE_ON = "__SGR_STRIKE_ON__";
    const STRIKE_OFF = "__SGR_STRIKE_OFF__";

    const ansi_up = new AnsiUp();
    let html = ansi_up.ansi_to_html(text);

    html = html
        .replaceAll(STRIKE_ON, "<span class='sgr-strike'>")
        .replaceAll(STRIKE_OFF, "</span>");

    return html;
}

function fetchLatestBlueStocksText(stockFilePrefix, siteRoot) {
    return fetch(new URL("stock_date.txt", siteRoot))
        .then(r => {
            if (!r.ok) {
                throw new Error("failed to load latest date");
            }

            return r.text();
        })
        .then(latestDate => {
            const fileName = latestDate.trim();

            return fetch(new URL(`history/${stockFilePrefix}_${fileName}.txt`, siteRoot));
        })
        .then(r => {
            if (!r.ok) {
                throw new Error("failed to load stock content");
            }

            return r.text();
        });
}

const appScript = document.currentScript;
const stockFilePrefix = appScript.dataset.stockFilePrefix;
const siteRoot = new URL("../", appScript.src);

fetchLatestBlueStocksText(stockFilePrefix, siteRoot)
    .then(text => {
        const processed = preprocessStrike(text);
        const finalHtml = renderAnsi(processed);

        document.getElementById("content").innerHTML = finalHtml;
    })
    .catch(error => {
        document.getElementById("content").textContent = error.message;
    });
