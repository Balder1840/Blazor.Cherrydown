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
 * �л��༭ģʽ
 * @param {'edit&preview'|'editOnly'|'previewOnly'} [model=edit&preview] ģʽ����
 * һ�㴿Ԥ��ģʽ�ʹ��༭ģʽ�ʺ�����Ļ��С���ն�ʹ�ã������ֻ��ƶ���
 */
export function switchMode(element, model) {
    element.$cherryEditor?.switchModel(model ?? 'edit&preview')
}

/**
 * ��ȡ�༭���ڵ�markdownԴ������
 * @returns markdownԴ������
 */
export function getValue(element) {
    return element.$cherryEditor?.getValue()
}

/**
 * ���Ǳ༭��������
 * @param {string} content markdown����
 * @param {boolean} keepCursor �Ƿ񱣳ֹ��λ��
 */
export function setValue(element, content, keepCursor = false) {
    return element.$cherryEditor?.setValue(content, keepCursor)
}

/**
 * ��ȡ�༭���ڵ�markdownԴ������
 * @returns {string} markdownԴ������
 */
export function getMarkdown(element) {
    return getValue(element)
}

/**
 * ���Ǳ༭��������
 * @param {string} content markdown����
 * @param {boolean} [keepCursor=false] �Ƿ񱣳ֹ��λ��
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
    // Ԥ��ҳ�治��Ҫ���¼�
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
                allowWhitespace: false, // �Ƿ�������β�ո�
            },
            strikethrough: {
                needWhitespace: false, // �Ƿ������ǰ��ո�
            },
            mathBlock: {
                engine: 'MathJax', // katex��MathJax
                src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js', // ���ʹ��MathJax plugins������Ҫʹ�ø�urlͨ��script��ǩ����
            },
            inlineMath: {
                engine: 'MathJax', // katex��MathJax
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
            updateLocationHash: false, // Ҫ��Ҫ����URL��hash
            defaultModel: 'pure', // pure: ����ģʽ/����ģʽ��ֻ��һ��С�㣻 full: ����ģʽ����չʾ���б���
            showAutoNumber: true
        }
    },
    // drawioIframeUrl: './drawio_demo.html',
    previewer: {
        // �Զ���markdownԤ������class
        // className: 'markdown'
        // �Ƿ�����Ԥ������༭������Ŀǰ֧�ֱ༭ͼƬ�ߴ硢�༭������ݣ�
        enablePreviewerBubble: false,
        // lazyLoadImg: {
        //   // ����ͼƬʱ�����Ҫչʾloadingͼ��������loadingͼ�ĵ�ַ
        //   loadingImgPath: '',
        //   // ͬһʱ������м���ͼƬ�������ͬʱ����6��ͼƬ
        //   maxNumPerTime: 2,
        //   // �����������ش����ͼƬ���������Ϊ0��������ͼƬ�����������ش��� �������Ϊ-1��������ͼƬ�������������ش���
        //   noLoadImgNum: 3,
        //   // �״��Զ����ؼ���ͼƬ������ͼƬ�Ƿ��������Ұ�ڣ���autoLoadImgNum = -1 ��ʾ���Զ�����������ͼƬ
        //   autoLoadImgNum: 2,
        //   // ��Լ���ʧ�ܵ�ͼƬ �� beforeLoadOneImgCallback ����false ��ͼƬ����ೢ�Լ��ؼ��Σ�Ϊ�˷�ֹ��ѭ�������5�Ρ���ͼƬ��srcΪγ��ͳ�����Դ���
        //   maxTryTimesPerSrc: 2,
        //   // ����һ��ͼƬ֮ǰ�Ļص�����������return false ����ֹ���ز���
        //   beforeLoadOneImgCallback: (img) => { return true; },
        //   // ����һ��ͼƬʧ��֮��Ļص�����
        //   failLoadOneImgCallback: (img) => {},
        //   // ����һ��ͼƬ֮��Ļص����������ͼƬ����ʧ�ܣ��򲻻�ص��ú���
        //   afterLoadOneImgCallback: (img) => {},
        //   // ����������ͼƬ����õĻص�����
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
        //       title: [1, (image, imageData) => `${image.alt.replace(/#.+$/, '')} (${imageData.naturalWidth} �� ${imageData.naturalHeight})`],
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
    // cherry��ʼ�����Ƿ��� location.hash ���Թ�������Ӧλ��
    autoScrollByHashAfterInit: true,
};