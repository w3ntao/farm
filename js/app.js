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

/*
 * Tabby ships the Darkside scheme as an Xresources palette.  ansi_up has a
 * useful default palette, but it emits those defaults as inline RGB styles,
 * which means a CSS override cannot reproduce a terminal theme.  These are
 * the exact Darkside normal and bright ANSI colours.
 */
const ANSI_THEMES = {
    darkside: {
        normal: [
            [0, 0, 0],       // black
            [232, 52, 28],   // red
            [104, 194, 86],  // green
            [242, 212, 44],  // yellow
            [28, 152, 232],  // blue
            [142, 105, 201], // magenta
            [28, 152, 232],  // cyan (Darkside intentionally shares blue)
            [186, 186, 186]  // white
        ],
        bright: [
            [0, 0, 0],       // bright black
            [224, 90, 79],   // bright red
            [119, 184, 105], // bright green
            [239, 214, 75],  // bright yellow
            [56, 124, 211],  // bright blue
            [149, 123, 190], // bright magenta
            [61, 151, 226],  // bright cyan
            [186, 186, 186]  // bright white
        ]
    }
};

function makeAnsiColor(rgb, className) {
    return { rgb, class_name: className };
}

function applyAnsiTheme(ansiUp, themeName) {
    const theme = ANSI_THEMES[(themeName || "").toLowerCase()];
    if (!theme) return;

    const normal = theme.normal.map((rgb, index) =>
        makeAnsiColor(rgb, `ansi-${["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"][index]}`)
    );
    const bright = theme.bright.map((rgb, index) =>
        makeAnsiColor(rgb, `ansi-bright-${["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"][index]}`)
    );

    ansiUp.ansi_colors = [normal, bright];
    // Keep ansi_up's xterm 256-colour and true-colour entries.  Only replace
    // the first 16 entries, which are the ANSI normal/bright colours.
    ansiUp.palette_256 = normal.concat(bright, ansiUp.palette_256.slice(16));
}

function renderAnsi(text, themeName) {
    const STRIKE_ON = "__SGR_STRIKE_ON__";
    const STRIKE_OFF = "__SGR_STRIKE_OFF__";

    const ansi_up = new AnsiUp();
    applyAnsiTheme(ansi_up, themeName);
    let html = ansi_up.ansi_to_html(text);

    html = html
        .replaceAll(STRIKE_ON, "<span class='sgr-strike'>")
        .replaceAll(STRIKE_OFF, "</span>");

    return html;
}

function fetchLatestBlueStocksText(stockFilePath, siteRoot) {
    return fetch(new URL(stockFilePath, siteRoot))
        .then(r => {
            if (!r.ok) {
                throw new Error("failed to load stock content");
            }

            return r.text();
        });
}

const appScript = document.currentScript;
const stockFilePath = appScript.dataset.stockFilePath;
const ansiTheme = appScript.dataset.ansiTheme;
const siteRoot = new URL("../", appScript.src);

fetchLatestBlueStocksText(stockFilePath, siteRoot)
    .then(text => {
        const processed = preprocessStrike(text);
        const finalHtml = renderAnsi(processed, ansiTheme);

        document.getElementById("content").innerHTML = finalHtml;
    })
    .catch(error => {
        document.getElementById("content").textContent = error.message;
    });
