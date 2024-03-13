let beforeStartCalled = false;

export function beforeStart() {
    loadScriptAndStyle()
}

export function beforeWebStart() {
    loadScriptAndStyle()
}

function loadScriptAndStyle() {
    if (beforeStartCalled) {
        return;
    }

    beforeStartCalled = true;

    loadCss("_content/Blazor.Cherrydown/cherry-markdown.min.css")
    loadScript("_content/Blazor.Cherrydown/pinyin/pinyin_dist.js")
    loadScript("_content/Blazor.Cherrydown/cherry-markdown.min.js")
}

function loadScript(src) {
    if (!document.querySelector(`[src$="${src}"]`)) {
        const customScript = document.createElement('script');
        customScript.setAttribute('src', src);

        const jsmark = document.querySelector('[blazor-cherrydown-js]') || document.querySelector('script:last-child');
        if (jsmark) {
            jsmark.before(customScript);
        } else {
            document.body.appendChild(customScript);
        }
    }
}

function loadCss(src) {
    if (!document.querySelector(`[href*="${src}"]`)) {
        const customStyle = document.createElement('link');
        customStyle.setAttribute('href', src);
        customStyle.setAttribute('rel', 'stylesheet');

        const cssMark = document.querySelector('[blazor-cherrydown-css]') || document.querySelector('link:last-child');
        if (cssMark) {
            cssMark.before(customStyle);
        } else {
            document.head.appendChild(customStyle);
        }
    }
}