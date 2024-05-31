// This is a JavaScript module that is loaded on demand. It can export any number of
// functions, and may import other JavaScript modules if required.

export function initialize(dotNetObjectRef, element, elementId, options) {
    const config = objectMerge(
        basicConfig, {
        id: elementId,
        value: options.markdown,
        editor: {
            id: `${elementId}_txtarea`,
            name: `${elementId}_txtarea_name`
        },
        engine: {
            global: {
                urlProcessor: (url, srcType) => {
                    //console.log('urlProcessor', url, srcType)
                    //if (srcType !== 'image') {
                    //    return options.relativePageUrl + "/" + url
                    //}
                    return url
                }
            },
            syntax: {
                toc: {
                    linkProcessor: (link) => {
                        //console.log('toc-link', `${options.relativePageUrl}/${link}`)
                        return `${options.relativePageUrl}${link}`
                    }
                }
            }
        },
        fileUpload(file, callback) {
            const fileModel = {
                id: ++element._blazorInputFileNextFileId,
                lastModified: new Date(file.lastModified).toISOString(),
                name: file.name,
                size: file.size,
                contentType: file.type,
                readPromise: undefined,
                arrayBuffer: undefined,
                blob: file,
            }
            element._blazorFilesById[fileModel.id] = fileModel;

            createFileUploadOverlay(element)
            element.$dotNetObjectRef.invokeMethodAsync('NotifyFileUpload', fileModel).then((data) => {
                delete element._blazorFilesById[data.fileId]

                if (data && data.isUploadSuccess) {
                    if (/video/i.test(file.type)) {
                        callback(data.fileUri, {
                            name: `${file.name.replace(/\.[^.]+$/, '')}`,
                            //poster: '_content/Blazor.Cherrydown/images/video-poster.png?poster=true',
                            isBorder: true,
                            isShadow: true,
                            isRadius: true,
                            width: '300px'
                        });
                    } else if (/image/i.test(file.type)) {
                        callback(data.fileUri, {
                            name: `${file.name.replace(/\.[^.]+$/, '')}`,
                            isShadow: true,
                            width: '300px',
                            height: 'auto',
                        });
                    } else {
                        callback(data.fileUri);
                    }
                } else {
                    callback(data.fileUri);
                }
            }).catch((err) => {
                console.error("file upload failed!", err)
                callback('file upload failed!');
            }).finally(() => {
                removeFileUploadOverlay(element)
            });
        },
        callback: {
            afterInit: () => {
                dotNetObjectRef.invokeMethodAsync("AfterMarkdownEditorInit")
            }
        }
    })

    function _init() {
        element.$cherryEditor = new Cherry(config);
        element.$dotNetObjectRef = dotNetObjectRef;
        element.$options = options
        element._blazorFilesById = {}
        element._blazorInputFileNextFileId = 0

        if (options.emitValue) {
            const debouncedUpdate = debounce(({ markdown }) => {
                element.$dotNetObjectRef.invokeMethodAsync("UpdateInternalValue", markdown)
            }, 500)
            element.$cherryEditor.onChange(debouncedUpdate)
        }
    }

    // hack
    // when page contains this editor refreshing, 
    // blazor does not guarantee cheery-markdown.js loads completed before this file(cherrydown.js) and method initialized called by JsInterop 
    if (window.Cherry) {
        _init()
    } else {
        let interval = setInterval(function () {
            if (window.Cherry) {
                clearInterval(interval)
                _init()
            }
        }, 50)
    }
}

/**
 * 切换编辑模式
 * @param {'edit&preview'|'editOnly'|'previewOnly'} [model=edit&preview] 模式类型
 * 一般纯预览模式和纯编辑模式适合在屏幕较小的终端使用，比如手机移动端
 */
export function switchMode(element, model) {
    element.$cherryEditor?.switchModel(model ?? 'edit&preview')
}

/**
 * 获取编辑区内的markdown源码内容
 * @returns markdown源码内容
 */
export function getValue(element) {
    return element.$cherryEditor?.getValue()
}

/**
 * 覆盖编辑区的内容
 * @param {string} content markdown内容
 * @param {boolean} keepCursor 是否保持光标位置
 */
export function setValue(element, content, keepCursor = false) {
    return element.$cherryEditor?.setValue(content, keepCursor)
}

/**
 * 获取编辑区内的markdown源码内容
 * @returns {string} markdown源码内容
 */
export function getMarkdown(element) {
    return getValue(element)
}

/**
 * 覆盖编辑区的内容
 * @param {string} content markdown内容
 * @param {boolean} [keepCursor=false] 是否保持光标位置
 */
export function setMarkdown(element, content, keepCursor = false) {
    return setValue(element, content, keepCursor);
}

//export function showPrompt(element, dotRef) {
//    createFileUploadOverlay(element)
//    console.log('showPrompt', { element, dotRef, refEquals: element.$dotNetObjectRef == dotRef })
//}

//export function showPrompt1(element, dotRef) {
//    removeFileUploadOverlay(element)
//    console.log('showPrompt1', { element, dotRef, refEquals: element.$dotNetObjectRef == dotRef })
//}

export function destroy(element) {
    element.$cherryEditor?.destroy()
    element.$cherryEditor && (element.$cherryEditor = null)
    delete element.$cherryEditor

    element.$dotNetObjectRef?.dispose()
    element.$dotNetObjectRef && (element.$dotNetObjectRef = null)
    delete element.$dotNetObjectRef

    delete element._blazorFilesById
    delete element._blazorInputFileNextFileId
}

export function readFileData(element, fileId) {
    const file = getFileById(element, fileId);
    return file.blob;
}

// https://github.com/dotnet/aspnetcore/blob/main/src/Components/Web.JS/src/InputFile.ts
function getFileById(element, fileId) {
    const file = element._blazorFilesById[fileId];
    if (!file) {
        throw new Error(`There is no file with ID ${fileId}. The file list may have changed. See https://aka.ms/aspnet/blazor-input-file-multiple-selections.`);
    }

    return file;
}

function createFileUploadOverlay(element) {
    const editor = document.querySelector(`#${element.id} .cherry`)
    const overlay = document.querySelector(`#${element.id} .cherry .file-upload-overlay`)
    if (editor && !overlay) {
        editor.classList.add("file-upload")

        const overlay = document.createElement('div');
        overlay.classList.add("file-upload-overlay")
        overlay.innerHTML = "Uploading, please wait a moment..."

        const spinner = document.createElement('div');
        spinner.classList.add("file-upload-spinner")

        overlay.prepend(spinner)
        editor.appendChild(overlay)
    }
}

function removeFileUploadOverlay(element) {
    const overlay = document.querySelector(`#${element.id} .cherry.file-upload .file-upload-overlay`)
    overlay?.remove()
}

const isObject = (item) =>
    item && typeof item === 'object' && !Array.isArray(item);

function objectMerge(target, ...sources) {
    if (!sources.length) {
        return target;
    }

    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                objectMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return objectMerge(target, ...sources);
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

const basicConfig = {
    id: 'markdown',
    externals: {
        echarts: window.echarts,
        katex: window.katex,
        MathJax: window.MathJax,
    },
    // 预览页面不需要绑定事件
    isPreviewOnly: false,
    engine: {
        global: {
            urlProcessor(url, srcType) {
                return url;
            },
        },
        syntax: {
            header: {
                anchorStyle: 'autonumber',
                // strict: false
            },
            codeBlock: {
                theme: 'okaidia', // theme for Prism
                editCode: false,
                changeLang: false
            },
            table: {
                enableChart: false,
                // chartEngine: Engine Class
            },
            fontEmphasis: {
                allowWhitespace: false, // 是否允许首尾空格
            },
            strikethrough: {
                needWhitespace: false, // 是否必须有前后空格
            },
            mathBlock: {
                engine: 'MathJax', // katex或MathJax
                src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js', // 如果使用MathJax plugins，则需要使用该url通过script标签引入
            },
            inlineMath: {
                engine: 'MathJax', // katex或MathJax
            },
            emoji: {
                useUnicode: true,
                customResourceURL: 'https://github.githubassets.com/images/icons/emoji/unicode/${code}.png?v8',
                upperCase: false,
            },
            toc: {
                tocStyle: 'nested',//'nested','plain'
                showAutoNumber: true
            }
        },
    },
    toolbars: {
        theme: 'dark',// light or dark
        toolbar: [
            'bold',
            'italic',
            {
                strikethrough: ['strikethrough', 'underline', 'sub', 'sup'],
            },
            'color',
            '|',
            'header',
            'justify',
            'size',
            '|',
            'quote',
            'table',
            'code',
            // '|',
            // 'drawIo',
            'ol',
            'ul',
            'checklist',
            '|',
            {
                insert: ['image', 'audio', 'video', 'link', 'hr', 'br', 'formula', 'toc', 'panel', 'detail', 'pdf', 'word', 'ruby'],
            },
            'graph',
            '|',
            'togglePreview',
            //'switchModel',
            '|',
            'export',
            //'codeTheme',
            'settings',
        ],
        toolbarRight: ['fullScreen', '|'],
        // bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', '|', 'size', 'color'], // array or false
        sidebar: ['theme'],
        toc: {
            updateLocationHash: false, // 要不要更新URL的hash
            defaultModel: 'pure', // pure: 精简模式/缩略模式，只有一排小点； full: 完整模式，会展示所有标题
            showAutoNumber: true
        }
    },
    // drawioIframeUrl: './drawio_demo.html',
    previewer: {
        // 自定义markdown预览区域class
        // className: 'markdown'
        // 是否启用预览区域编辑能力（目前支持编辑图片尺寸、编辑表格内容）
        enablePreviewerBubble: false,
        // lazyLoadImg: {
        //   // 加载图片时如果需要展示loading图，则配置loading图的地址
        //   loadingImgPath: '',
        //   // 同一时间最多有几个图片请求，最大同时加载6张图片
        //   maxNumPerTime: 2,
        //   // 不进行懒加载处理的图片数量，如果为0，即所有图片都进行懒加载处理， 如果设置为-1，则所有图片都不进行懒加载处理
        //   noLoadImgNum: 3,
        //   // 首次自动加载几张图片（不论图片是否滚动到视野内），autoLoadImgNum = -1 表示会自动加载完所有图片
        //   autoLoadImgNum: 2,
        //   // 针对加载失败的图片 或 beforeLoadOneImgCallback 返回false 的图片，最多尝试加载几次，为了防止死循环，最多5次。以图片的src为纬度统计重试次数
        //   maxTryTimesPerSrc: 2,
        //   // 加载一张图片之前的回调函数，函数return false 会终止加载操作
        //   beforeLoadOneImgCallback: (img) => { return true; },
        //   // 加载一张图片失败之后的回调函数
        //   failLoadOneImgCallback: (img) => {},
        //   // 加载一张图片之后的回调函数，如果图片加载失败，则不会回调该函数
        //   afterLoadOneImgCallback: (img) => {},
        //   // 加载完所有图片后调用的回调函数
        //   afterLoadAllImgCallback: () => { alert('all img lond done') },
        // }
    },
    keydown: [],
    //extensions: [],
    callback: {
        changeString2Pinyin: pinyin,
        // from preview-demo
        // onClickPreview: function(e) {
        //   const { target } = e;
        //   if (target.tagName === 'IMG') {
        //     console.log('click img', target);
        //     const tmp = new Viewer(target, {
        //       button: false,
        //       navbar: false,
        //       title: [1, (image, imageData) => `${image.alt.replace(/#.+$/, '')} (${imageData.naturalWidth} × ${imageData.naturalHeight})`],
        //       hidden() {
        //         tmp.destroy()
        //       },
        //     });
        //     tmp.show();
        //   }
        // }
    },
    editor: {
        id: 'cherry-text',
        name: 'cherry-text',
        autoSave2Textarea: true,
        defaultModel: 'edit&preview',
        // height: '600px',
        codemirror: {
            placeholder: 'Memodown',
        },
    },
    // cherry初始化后是否检查 location.hash 尝试滚动到对应位置
    autoScrollByHashAfterInit: true,
};