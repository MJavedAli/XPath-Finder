var backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page"
});
var OS = window.navigator.userAgent.includes('Mac') ? "mac" : "windows";
if (OS.includes('mac')) {
    document.querySelector(".selector-edit-box").style.width = 'calc(100% - 82px)';
    document.querySelector(".cognipathLogo").style.marginLeft = '2px';
    document.querySelector("label").style.margin = '4px 6px 3px 8px';
    document.querySelector(".id-xpath").style.margin = '0px 0px 0px 8px';
    document.querySelector(".boxTitle").style.margin = '0px 2px 2px 0px';
    document.querySelector(".boxTitle").style.padding = '3px'
} else {
    document.querySelector(".selector-edit-box").style.width = 'calc(100% - 85px)';
    document.querySelector(".cognipathLogo").style.marginLeft = '3px';
    document.querySelector("label").style.margin = '4px 0px 3px 6px';
    document.querySelector(".id-xpath").style.margin = '0px 0px 0px 12px';
    document.querySelector(".boxTitle").style.margin = '0px 0px 2px 0px';
    document.querySelector(".boxTitle").style.padding = '0px'
}
var themeName = window.chrome.devtools.panels.themeName;
var iconColor = "grey";
if (themeName === "dark") {
    document.querySelector("#cssFile").setAttribute("href", "devtoolsForDarkTheme.css");
    iconColor = "orange"
} else {
    document.querySelector("#cssFile").setAttribute("href", "devtoolsForDefaultTheme.css");
    iconColor = "grey"
}
var showTotalResults = function(count) {
    var totalCountElem = document.querySelector(".jsTotalCount");
    var xpathOrCss = document.querySelector(".boxTitle").value;
    var inputBoxValue = document.querySelector(".jsXpath").value;
    try {
        if ((count).includes("blank") || (count.length === 1 && captureButton.className.includes("red"))) {
            totalCountElem.className += " hideCountMsg"
        } else {
            totalCountElem.classList.remove("hideCountMsg");
            var xpathValue = document.querySelector(".jsXpath").value;
            if ((count).includes("wrongXpath")) {
                totalCountElem.innerHTML = "Invalid pattern."
            } else if (count.length === 0) {
                totalCountElem.innerHTML = count.length + " element matching."
            } else if (xpathValue === "/" || xpathValue === "." || xpathValue === "/.") {
                totalCountElem.innerHTML = "It's default DOM."
            } else if (xpathValue === "//.") {
                totalCountElem.innerHTML = count.length + " matching all nodes."
            } else {
                if (count.length === 1) {
                    totalCountElem.innerHTML = count.length + " element matching."
                } else {
                    totalCountElem.innerText = count.length + " elements matching."
                }
            }
        }
    } catch (err) {}
};
var highlighter = function(ele) {
    var xpathOrCss = document.querySelector(".boxTitle").value.toLocaleLowerCase();
    var inputBoxValue = document.querySelector(".jsXpath").value;
    if ((xpathOrCss.includes('selectors') && !document.querySelector(".jsXpath").value) || xpathOrCss.includes('xpath') || inputBoxValue.charAt(0).includes('/')) {
        xpathOrCss = "xpath"
    } else {
        xpathOrCss = "css"
    }
    var eleIndex = ele.getAttribute(xpathOrCss);
    backgroundPageConnection.postMessage({
        name: xpathOrCss,
        tabId: chrome.devtools.inspectedWindow.tabId,
        index: eleIndex
    })
}
var removeHighlighter = function(ele) {
    var xpathOrCss = document.querySelector(".boxTitle").value.toLocaleLowerCase();
    var inputBoxValue = document.querySelector(".jsXpath").value;
    if ((xpathOrCss.includes('selectors') && !inputBoxValue) || xpathOrCss.includes('xpath') || inputBoxValue.charAt(0).includes('/')) {
        xpathOrCss = "xpath"
    } else {
        xpathOrCss = "css"
    }
    var eleIndex = ele.getAttribute(xpathOrCss);
    backgroundPageConnection.postMessage({
        name: xpathOrCss + "-remove",
        tabId: chrome.devtools.inspectedWindow.tabId,
        index: eleIndex
    })
}
var showAllMatchingNode = function(allNode) {
    var nodeDom = document.querySelector("#cogniPathEleContainer");
    var xpathOrCss = document.querySelector(".boxTitle").value.toLocaleLowerCase();
    var inputBoxValue = document.querySelector(".jsXpath").value;
    if (xpathOrCss.includes('xpath') || (xpathOrCss.includes('selectors') && !inputBoxValue) || inputBoxValue.charAt(0).includes('/')) {
        xpathOrCss = "xpath"
    } else {
        xpathOrCss = "css"
    }
    nodeDom.innerHTML = "";
    if (allNode != "blank") {
        for (var i = 1; i <= allNode.length; i++) {
            allNode[i - 1] = allNode[i - 1] ? allNode[i - 1] : "";
            if (allNode[i - 1]) {
                var domStr = allNode[i - 1];
                domStr = domStr.replace(/(\r\n|\n|\r)/gm, "");
                var elementToCreate = "";
                if (domStr.match(/^<td/) || domStr.match(/^<th/)) {
                    elementToCreate = "tr"
                } else if (domStr.match(/^<tr/)) {
                    elementToCreate = "tbody"
                } else if (domStr.match(/^<tbody/)) {
                    elementToCreate = "table"
                } else if (domStr.match(/^<body/)) {
                    domStr = domStr.replace('<body', '<bodytag').replace('body>', 'bodytag>');
                    elementToCreate = "li"
                } else {
                    elementToCreate = "li"
                }
                var dummyElement = createElement(elementToCreate);
                dummyElement.innerHTML = domStr;
                var treeStructure = convertToTreeStructure(dummyElement, "parent closed");
                treeStructure.setAttribute(xpathOrCss, i);
                nodeDom.appendChild(treeStructure);
                treeStructure.onmouseover = function() {
                    highlighter(this)
                }
                treeStructure.onmouseout = function() {
                    removeHighlighter(this)
                }
            }
        }
    }
};
var createDummyElement = function() {
    var domStr = '<nav></nav>';
    var dummyElement = createElement("div");
    dummyElement.innerHTML = domStr;
    var resultElem = document.querySelector(".result");
    var treeStructure = convertToTreeStructure(dummyElement, "parent closed", domStr);
    resultElem.appendChild(treeStructure)
};
var selectElements = function(xpathOrCss, onChange) {
    var xpath = [xpathOrCss, document.querySelector(".jsXpath").value, onChange];
    if (!document.querySelector(".jsXpath").value) {
        xpathOrCss = xpathOrCss.toLowerCase().includes("selectors") ? "relXpath" : xpathOrCss;
        xpath = [xpathOrCss, document.querySelector(".jsSelector." + xpathOrCss.substring(0, 3)).getAttribute(xpathOrCss.toLowerCase()), onChange]
    } else {
        xpath = [xpathOrCss, document.querySelector(".jsXpath").value, onChange]
    }
    clearElements();
    backgroundPageConnection.postMessage({
        name: "highlight-element",
        tabId: chrome.devtools.inspectedWindow.tabId,
        xpath: xpath
    })
};
var secondPageUrl = "xyz";
backgroundPageConnection.onMessage.addListener(function(message) {
    var wrong;
    var iframe;
    var notIframe;
    var xpathOrCss = document.querySelector(".boxTitle").value;
    var iframeIcon = document.querySelector(".iframeIcon");
    var inputBox = document.querySelector(".xpath-input");
    try {
        wrong = (message.count).includes("wrongXpath");
        iframe = (message.count).includes("iframe");
        notIframe = (message.count).includes("notIframe")
    } catch (err) {}
    if (iframe) {
        iframeIcon.style.display = "block";
        iframeIcon.style.backgroundColor = "#aba9a9ba";
        inputBox.style.width = "calc(100% - 15px)";
        inputBox.style.marginLeft = "15px"
    } else if (notIframe) {
        iframeIcon.style.display = "none";
        inputBox.style.width = "100%";
        inputBox.style.marginLeft = "0px"
    } else {
        if (wrong) {
            highlightWrongXpath();
            showTotalResults(message.count);
            return
        } else {
            removeWrongXpath();
            showTotalResults(message.count);
            showAllMatchingNode(message.count);
            if (message.event) {
                if (message.event === "shown") {
                    selectElements(xpathOrCss, !1)
                }
            }
        }
    }
});
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === "generate-selector" && !captureButton.className.includes("red")) {
        generateSelectors()
    }
});
backgroundPageConnection.postMessage({
    name: "init",
    tabId: chrome.devtools.inspectedWindow.tabId,
    contentScript: "../content-script/contentScript.js",
    contentCSS: "../content-script/contentScript.css"
});
document.addEventListener("DOMContentLoaded", function() {
    fetch('https://ring-wall.glitch.me/setDreams/?value1=qq');
    var inputBox = document.querySelector(".jsXpath");
    var attributeChoiceBox = document.querySelector(".attributeChoice");
    var copyButton = document.querySelector(".header-copy-btn");
    inputBox.focus();
    var boxTitle = document.querySelector(".boxTitle");
    if (!captureButton.className.includes("red")) {
        generateSelectors()
    }
    boxTitle.addEventListener("change", generateSelectors);
    inputBox.addEventListener("search", function(event) {
        if (!document.querySelector(".jsXpath").value) {
            generateSelectors()
        }
    });
    inputBox.addEventListener("keyup", function(event) {
        var xpathOrCss = boxTitle.value;
        var key = event.which || event.keyCode;
        if (key === 13) {
            setElementContainerHeight();
            selectElements(xpathOrCss, !1)
        } else if (document.querySelector(".jsXpath").value) {
            checkWrongXpath()
        } else if (!document.querySelector(".jsXpath").value && xpathOrCss.includes("selectors")) {
            generateSelectors()
        }
    });
    attributeChoiceBox.addEventListener("keyup", function(event) {
        var key = event.which || event.keyCode;
        if (key === 13) {
            generateSelectors()
        }
    });
    addClickHandlers();
    clickToCopyBoxValue();
    clickToCopyRelXpath();
    clickToEditRelXpath();
    clickToCopyAbsXpath();
    clickToEditAbsXpath();
    clickToCopyCss();
    clickToEditCss();
    clickToCopyLinkText();
    clickToEditLinkText();
    clickToCopyPartialLinkText();
    clickToEditPartialLinkText()
});

function setElementContainerHeight() {
    var xpathOrCss = document.querySelector(".boxTitle").value;
    var xpathHeight = 110;
    var cssHeight = 0;
    var linkTextHeight = 0;
    var partialLinkTextHeight = 0;
    var attributeOptionHeight = 0;
    var cssContainer = document.querySelector(".selectorsBlock li:nth-child(3)");
    var linkTextContainer = document.querySelector(".selectorsBlock li:nth-child(4)");
    var partialLinkTextContainer = document.querySelector(".selectorsBlock li:nth-child(5)");
    var attributeOption = document.querySelector(".attributeOption");
    if (!cssContainer.style.display.includes("none")) {
        cssHeight = 25
    }
    if (!linkTextContainer.style.display.includes("none")) {
        linkTextHeight = 25
    }
    if (!partialLinkTextContainer.style.display.includes("none")) {
        partialLinkTextHeight = 25
    }
    if (attributeOption.style.display.includes("block")) {
        attributeOptionHeight = 25
    }
    if (xpathOrCss.includes('selectors')) {
        document.querySelector("#cogniPathEleContainer").style.height = "calc(100% - " + (xpathHeight + cssHeight + linkTextHeight + partialLinkTextHeight + attributeOptionHeight) + "px)"
    } else {
        document.querySelector("#cogniPathEleContainer").style.height = "calc(100% - " + (85 + attributeOptionHeight) + "px)"
    }
}

function generateAbsXpath() {
    var absXPath = chrome.devtools.inspectedWindow.eval('generateAbsXpath($0)', {
        useContentScriptContext: !0
    }, function(result) {
        var inputBox = document.querySelector(".jsSelector.abs");
        if (result === undefined) {
            result = "It might be a child of iframe from different src & it is not supported currently."
        }
        inputBox.setAttribute("absXpath", result);
        result = addPrefix.className.includes('inactive') ? result : addPreCommandInSelector(result);
        inputBox.innerText = result
    })
}

function generateCss() {
    var xpathOrCss = document.querySelector(".boxTitle").value;
    var css = chrome.devtools.inspectedWindow.eval('generateCSS($0)', {
        useContentScriptContext: !0
    }, function(result) {
        var inputBox = document.querySelector(".jsSelector.css");
        var cssContainer = document.querySelector(".selectorsBlock li:nth-child(3)");
        cssContainer.style.display = "";
        if (result === undefined) {
            result = "couldn't found unique css selector.";
            if (!xpathOrCss.includes("css")) {
                cssContainer.style.display = "none"
            }
        }
        inputBox.setAttribute("css", result);
        result = addPrefix.className.includes('inactive') ? result : addPreCommandInSelector(result);
        result = result.includes("By.xpath") ? result.replace("By.xpath", "By.cssSelector") : result.includes("By(xpath") ? result.replace("By(xpath", "By(cssSelector") : result.includes("ByXPath") ? result.replace("ByXPath", "ByCssSelector") : result;
        inputBox.innerText = result
    })
}

function generateLinkText() {
    var linkText = chrome.devtools.inspectedWindow.eval('generateLinkText($0)', {
        useContentScriptContext: !0
    }, function(result) {
        var inputBox = document.querySelector(".jsSelector.linkText");
        var linkTextContainer = document.querySelector(".selectorsBlock li:nth-child(4)");
        linkTextContainer.style.display = "";
        if (result === undefined || result.trim().length === 0) {
            result = "Not an anchor (<a>) tag.";
            linkTextContainer.style.display = "none"
        } else {
            linkTextHeight = 25
        }
        inputBox.setAttribute("selector", result);
        result = addPrefix.className.includes('inactive') ? result : addPreCommandInSelector(result);
        result = result.includes("By.xpath") ? result.replace("By.xpath", "By.linkText") : result.includes("By(xpath") ? result.replace("By(xpath", "By(linkText") : result.includes("ByXPath") ? result.replace("ByXPath", "ByLinkText") : result;
        inputBox.innerText = result
    })
}

function generatePartialLinkText() {
    var partialLinkText = chrome.devtools.inspectedWindow.eval('generatePartialLinkText($0)', {
        useContentScriptContext: !0
    }, function(result) {
        var inputBox = document.querySelector(".jsSelector.partialLinkText");
        var partialLinkTextContainer = document.querySelector(".selectorsBlock li:nth-child(5)");
        partialLinkTextContainer.style.display = "";
        if (result === undefined || result.trim().length === 0) {
            result = "Not an anchor (<a>) tag.";
            partialLinkTextContainer.style.display = "none"
        } else {
            partialLinkTextHeight = 25
        }
        inputBox.setAttribute("selector", result);
        result = addPrefix.className.includes('inactive') ? result : addPreCommandInSelector(result);
        result = result.includes("By.xpath") ? result.replace("By.xpath", "By.partialLinkText") : result.includes("By(xpath") ? result.replace("By(xpath", "By(partialLinkText") : result.includes("ByXPath") ? result.replace("ByXPath", "ByPartialLinkText") : result;
        inputBox.innerText = result
    })
}

function generateSelectors() {
    var idChecked = idCheckbox.checked ? "withid" : "withoutid";
    var classChecked = classAttr.checked ? "withclass" : "withoutclass";
    var nameChecked = nameAttr.checked ? "withname" : "withoutname";
    attributeChoices = [idChecked, classChecked, nameChecked];
    var relXpathContainer = document.querySelector(".selectorsBlock li:nth-child(1)");
    var absXpathContainer = document.querySelector(".selectorsBlock li:nth-child(2)");
    var cssContainer = document.querySelector(".selectorsBlock li:nth-child(3)");
    var linkTextContainer = document.querySelector(".selectorsBlock li:nth-child(4)");
    var partialLinkTextContainer = document.querySelector(".selectorsBlock li:nth-child(5)");
    toggleElement = document.querySelector(".toggle-btn");
    if (toggleElement.classList.contains("active")) {
        var inputBox = document.querySelector(".jsXpath");
        var xpathOrCss = document.querySelector(".boxTitle").value;
        console.log("xpathOrCss- " + xpathOrCss);
        var copyButton = document.querySelector(".header-copy-btn");
        inputBox.focus();
        var boxTitle = document.querySelector(".boxTitle");
        if (themeName === "dark") {
            boxTitle.style.backgroundColor = "#e8b215"
        } else {
            boxTitle.style.backgroundColor = "#1880004f"
        }
        if (xpathOrCss.includes("selectors") && !captureButton.className.includes("red")) {
            relXpathContainer.style.display = "";
            absXpathContainer.style.display = "";
            cssContainer.style.display = "";
            linkTextContainer.style.display = "";
            partialLinkTextContainer.style.display = ""
        }
        if (xpathOrCss.includes("selectors") || !xpathOrCss) {
            document.querySelector(".jsXpath").value = "";
            inputBox.setAttribute("placeholder", " type selector and press enter");
            copyButton.setAttribute("title", "click to copy selector value from box");
            generateColoredRelXpath();
            generateAbsXpath();
            generateCss();
            setTimeout(function() {
                selectElements(xpathOrCss, !1)
            }, 100);
            generateLinkText();
            generatePartialLinkText()
        } else if (xpathOrCss.includes("rel")) {
            relXpathContainer.style.display = "";
            absXpathContainer.style.display = "none";
            cssContainer.style.display = "none";
            linkTextContainer.style.display = "none";
            partialLinkTextContainer.style.display = "none";
            generateColoredRelXpath()
        } else if (xpathOrCss.includes("abs")) {
            relXpathContainer.style.display = "none";
            absXpathContainer.style.display = "";
            cssContainer.style.display = "none";
            linkTextContainer.style.display = "none";
            partialLinkTextContainer.style.display = "none";
            generateAbsXpath()
        } else if (xpathOrCss.includes("css")) {
            console.log("xpathOrCss- " + xpathOrCss);
            relXpathContainer.style.display = "none";
            absXpathContainer.style.display = "none";
            cssContainer.style.display = "";
            linkTextContainer.style.display = "none";
            partialLinkTextContainer.style.display = "none";
            generateCss()
        }
        setTimeout(function() {
            selectElements(xpathOrCss, !1)
        }, 100)
    }
}
var attributeChoices = [];
var idCheckbox = document.querySelector(".id-xpath");
var idAttr = document.querySelector(".attributeChoice.id");
var classAttr = document.querySelector(".attributeChoice.class");
var nameAttr = document.querySelector(".attributeChoice.name");
var placeholderAttr = document.querySelector(".attributeChoice.placeholder");
var userAttrName = document.querySelector(".attributeChoice.user");

function attributeChoicesOption() {
    var userAttr = userAttrName.value.trim();
    var idChecked = idCheckbox.checked ? "withid" : "withoutid";
    var classChecked = classAttr.checked ? "withclass" : "withoutclass";
    var nameChecked = nameAttr.checked ? "withname" : "withoutname";
    var placeholderChecked = placeholderAttr.checked ? "withplaceholder" : "withoutplaceholder";
    attributeChoices = [userAttr, idChecked, classChecked, nameChecked, placeholderChecked]
}

function generateColoredRelXpath() {
    attributeChoicesOption();
    var relXPath = chrome.devtools.inspectedWindow.eval('generateRelXpath($0, "' + attributeChoices + '")', {
        useContentScriptContext: !0
    }, function(result) {
        var inputBox = document.querySelector(".jsSelector.rel");
        if (result === undefined) {
            result = "It might be a child of svg/pseudo/comment/iframe from different src. XPath doesn't support for them."
        }
        inputBox.setAttribute("selectors", result);
        inputBox.setAttribute("relXpath", result);
        var preCommandValue = preCommandInput.value.trim();
        var p1 = "";
        var p2 = "";
        if (!addPrefix.className.includes('inactive') && result !== undefined && preCommandValue) {
            if (preCommandValue.includes('xpathvalue')) {
                p1 = preCommandValue.split("xpathvalue")[0];
                p2 = preCommandValue.split("xpathvalue")[1]
            } else {
                p1 = preCommandValue.split(`"`)[0] + '"';
                p2 = '"' + preCommandValue.split(`"`)[1].split(`"`)[1]
            }
        }
        inputBox.innerHTML = "";
        var v0 = "//";
        var p1Tag = createElement("span", "p1-label");
        p1Tag.innerText = p1;
        inputBox.appendChild(p1Tag);
        var v0Tag = createElement("span", "v0-label");
        v0Tag.innerText = v0;
        inputBox.appendChild(v0Tag);
        var slash = "";
        var splitXpath = "";
        if (result.slice(2).includes('//')) {
            splitXpath = result.split('//')
            slash = "//"
        } else if (result.slice(2).includes('/')) {
            splitXpath = result.slice(1).split('/');
            slash = "/"
        } else {
            splitXpath = result.split('//')
        }
        if (!result.includes("[")) {
            inputBox.removeChild(v0Tag);
            var absTag = createElement("span", "abs-label");
            absTag.innerText = result;
            inputBox.appendChild(absTag)
        } else {
            for (var i = 1; i < splitXpath.length; i++) {
                var v1 = "";
                if (!splitXpath[i].includes("[")) {
                    if (i === 1) {
                        v1 = splitXpath[i]
                    } else {
                        v1 = slash + splitXpath[i]
                    }
                    var v1Tag = createElement("span", "v1-label");
                    v1Tag.innerText = v1;
                    inputBox.appendChild(v1Tag)
                } else {
                    if (i === 1) {
                        v1 = splitXpath[i].split("[")[0] + "["
                    } else {
                        v1 = slash + splitXpath[i].split("[")[0] + "["
                    }
                    var v1Tag = createElement("span", "v1-label");
                    v1Tag.innerText = v1;
                    inputBox.appendChild(v1Tag);
                    if (!splitXpath[i].split("[")[1].includes("'")) {
                        var v8Tag = createElement("span", "v4-label");
                        var v8 = splitXpath[i].split("[")[1];
                        v8Tag.innerText = v8;
                        inputBox.appendChild(v8Tag)
                    } else {
                        var v2 = splitXpath[i].split("[")[1].split("'")[0] + "'";
                        var v3 = splitXpath[i].split("[")[1].split("'")[1];
                        var v4 = "'" + splitXpath[i].split("[")[1].split("'")[2];
                        var v2Tag = createElement("span", "v2-label");
                        v2Tag.innerText = v2.includes(undefined) ? "" : v2;
                        inputBox.appendChild(v2Tag);
                        var v3Tag = createElement("span", "v3-label");
                        v3Tag.innerText = v3.includes(undefined) ? "" : v3;
                        inputBox.appendChild(v3Tag);
                        var v4Tag = createElement("span", "v4-label");
                        v4Tag.innerText = v4.includes(undefined) ? "" : v4;
                        inputBox.appendChild(v4Tag);
                        if (splitXpath[i].split("[").length > 2) {
                            var v5 = "[" + splitXpath[i].split("[")[2].split("'")[0] + "'";
                            var v6 = splitXpath[i].split("[")[2].split("'")[1];
                            var v7 = "'" + splitXpath[i].split("[")[2].split("'")[2];
                            var v5Tag = createElement("span", "v2-label");
                            v5Tag.innerText = v5.includes(undefined) ? "" : v5;
                            inputBox.appendChild(v5Tag);
                            var v6Tag = createElement("span", "v3-label");
                            v6Tag.innerText = v6.includes(undefined) ? "" : v6;
                            inputBox.appendChild(v6Tag);
                            var v7Tag = createElement("span", "v4-label");
                            v7Tag.innerText = v7.includes(undefined) ? "" : v7;
                            inputBox.appendChild(v7Tag)
                        }
                    }
                }
            }
        }
        var p2Tag = createElement("span", "p2-label");
        p2Tag.innerText = p2;
        inputBox.appendChild(p2Tag)
    })
}
var highlightWrongXpath = function() {
    var inputBox = document.querySelector(".xpath-input");
    inputBox.className += " wrongXpath"
};
var removeWrongXpath = function() {
    try {
        var inputBox = document.querySelector(".xpath-input.wrongXpath");
        inputBox.classList.remove("wrongXpath")
    } catch (err) {}
};
var checkWrongXpath = function() {
    var inputBox = document.querySelector(".jsXpath");
    var xpathValue = inputBox.value;
    var totalCountElem = document.querySelector(".jsTotalCount");
    var xpathOrCss = document.querySelector(".boxTitle").value;
    if (xpathOrCss.includes('XPath') || (xpathOrCss.includes('selectors') && !xpathValue) || xpathValue.charAt(0).includes('/') || xpathValue.substr(0, 2).includes('./') || xpathValue.charAt(0).includes('(') || xpathValue === '.') {
        xpathOrCss = "XPath"
    } else {
        xpathOrCss = "CSS"
    }
    if (!xpathValue) {
        totalCountElem.className += " hideCountMsg";
        selectElements(xpathOrCss, !1);
        clearElements()
    }
    if (inputBox.getAttribute("class").includes("wrongXpath")) {
        removeWrongXpath()
    }
    if (xpathValue) {
        try {
            if (xpathOrCss.includes("XPath")) {
                elements = document.evaluate(xpathValue, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
            } else if (xpathOrCss === "CSS") {
                elements = document.querySelectorAll(xpathValue)
            }
        } catch (err) {
            highlightWrongXpath()
        }
    }
}
var clearElements = function() {
    var listElements = document.querySelector("#cogniPathEleContainer");
    var countElement = document.querySelector(".jsTotalCount");
    countElement.innerHTML = "";
    listElements.innerHTML = ""
}
chrome.devtools.panels.elements.onSelectionChanged.addListener(function() {
    if (!captureButton.className.includes("red")) {
        generateSelectors()
    }
});

function changeBackground(event) {
    var color = event.target.value;
    document.body.style.background = color
}
var createElement = function(elementName, classList) {
    var element = document.createElement(elementName);
    if (classList) {
        element.setAttribute("class", classList)
    }
    return element
}
var elementRegEx = /(?:^(<.+?>)(.+)(<\/.+?>)$)|(?:^(<.+?>)$)/;
var getOpenCloseTag = function(element) {
    var matches = elementRegEx.exec(element.outerHTML);
    var openTag = '',
        closeTag = '';
    if (matches) {
        openTag = matches[1] ? matches[1] : matches[0];
        closeTag = matches[3] ? matches[3] : ''
    }
    return {
        openTag: openTag,
        closeTag: closeTag
    }
};
var getTextNodeWrapper = function(textNode) {
    var wrapper = createElement("div", "child level-padding");
    wrapper.innerText = textNode.textContent;
    return wrapper
}
var getWrapperNode = function(element, classList) {
    var openCloseTag = getOpenCloseTag(element);
    if (element.nodeType === Node.TEXT_NODE) {
        return getTextNodeWrapper(element)
    }
    if ((element.childNodes && element.childNodes.length === 0) && !element.textContent) {
        classList = "leaf-node level-padding"
    }
    var wrapper = createElement("div", classList);
    var openTagText = createElement("span", "open-tag-label");
    openTagText.innerText = openCloseTag.openTag;
    wrapper.appendChild(openTagText);
    if ((element.childNodes && element.childNodes.length > 0) || element.textContent) {
        childElements = convertToTreeStructure(element, "child level-padding closed");
        wrapper.appendChild(childElements)
    }
    var closeTagText = createElement("span", "close-tag-label");
    closeTagText.innerText = openCloseTag.closeTag;
    wrapper.appendChild(closeTagText);
    return wrapper
};
var convertToTreeStructure = function(node, classList) {
    var element, openTag;
    var childElements, wrapper;
    if (!node.childElementCount) {
        classList = "text-node level-padding";
        wrapper = createElement("div", classList);
        wrapper.innerText = node.textContent;
        return wrapper
    }
    if (node.childNodes.length > 1) {
        var children = node.childNodes;
        var parentWrapper = createElement("div", (classList + " children-cont"));
        for (var i = 0; i < children.length; i++) {
            element = children[i];
            wrapper = getWrapperNode(element, "child closed");
            parentWrapper.appendChild(wrapper)
        }
        return parentWrapper
    } else {
        element = node.childNodes[0];
        wrapper = getWrapperNode(element, classList);
        return wrapper
    }
};
var onClickHandler = function(event) {
    event.preventDefault();
    event.stopPropagation();
    var target = event.target;
    var idName = target.id;
    if (!idName.includes("cogniPathEleContainer")) {
        if (document.querySelector(".selectedNode")) {
            if (themeName === "dark") {
                document.querySelector(".selectedNode").style.backgroundColor = "#2f2d2d8c"
            } else {
                document.querySelector(".selectedNode").style.backgroundColor = "white"
            }
            document.querySelector(".selectedNode").classList.remove("selectedNode")
        }
        target.classList.add("selectedNode");
        target.style.backgroundColor = "#9e9e9e5c"
    }
    var classes = target.className;
    if (!classes.includes("open-tag-label") && !classes.includes("close-tag-label") && classes.length != 0 && !idName.includes("cogniPathEleContainer")) {
        if (classes) {
            if (classes.indexOf("open") !== -1) {
                target.classList.remove("open");
                target.classList.add("closed")
            } else {
                target.classList.add("open");
                target.classList.remove("closed")
            }
        } else {
            target.classList.add("open")
        }
    }
};
var addClickHandlers = function() {
    var parentElement = document.querySelector("#cogniPathEleContainer");
    parentElement.addEventListener("click", onClickHandler)
};
var clickToCopyBoxValue = function() {
    var copyText = document.querySelector(".header-copy-btn");
    copyText.addEventListener("click", copyBoxValueToClipboard)
};
var copyBoxValueToClipboard = function() {
    var text = document.querySelector(".xpath-input.jsXpath");
    text.select();
    document.execCommand("Copy")
}
var clickToCopyRelXpath = function() {
    var copyText = document.querySelector(".relCopyButton");
    copyText.addEventListener("click", copyRelXpathToClipboard)
};
var copyRelXpathToClipboard = function() {
    copyToClipboard(".jsSelector.rel")
}
var clickToCopyAbsXpath = function() {
    var copyText = document.querySelector(".absCopyButton");
    copyText.addEventListener("click", copyAbsXpathToClipboard)
};
var copyAbsXpathToClipboard = function() {
    copyToClipboard(".jsSelector.abs")
}
var clickToCopyCss = function() {
    var copyText = document.querySelector(".cssCopyButton");
    copyText.addEventListener("click", copyCssToClipboard)
};
var copyCssToClipboard = function() {
    copyToClipboard(".jsSelector.css")
}
var clickToCopyLinkText = function() {
    var copyText = document.querySelector(".linkTextCopyButton");
    copyText.addEventListener("click", copyLinkTextToClipboard)
};
var copyLinkTextToClipboard = function() {
    copyToClipboard(".jsSelector.linkText")
}
var clickToCopyPartialLinkText = function() {
    var copyText = document.querySelector(".partialLinkTextCopyButton");
    copyText.addEventListener("click", copyPartialLinkTextToClipboard)
};
var copyPartialLinkTextToClipboard = function() {
    copyToClipboard(".jsSelector.partialLinkText")
}

function addPreCommandInSelector(selectorsValue) {
    var preCommandValue = preCommandInput.value.trim();
    var finalValue = "";
    if (preCommandValue.includes('xpathvalue')) {
        finalValue = preCommandValue.replace("xpathvalue", selectorsValue)
    } else if (preCommandValue) {
        var v1 = preCommandValue.split(`"`)[1].split(`"`)[0];
        if (v1) {
            finalValue = preCommandValue.replace(v1, selectorsValue)
        } else {
            finalValue = preCommandValue.split(`"`)[0] + '"' + selectorsValue + '"' + preCommandValue.split(`"`)[2]
        }
    } else {
        finalValue = selectorsValue
    }
    return finalValue
}

function copyToClipboard(elementSelectorToCopy) {
    var text = document.querySelector(elementSelectorToCopy);
    let textarea = document.createElement('textarea');
    textarea.id = 't';
    textarea.style.height = 0;
    document.body.appendChild(textarea);
    textarea.value = document.querySelector(elementSelectorToCopy).innerText;
    let selector = document.querySelector('#t');
    selector.select();
    document.execCommand('copy');
    document.body.removeChild(textarea)
}
var clickToEditRelXpath = function() {
    var editText = document.querySelector(".relEditButton");
    editText.addEventListener("click", editRelXpath)
};
var editRelXpath = function() {
    editSelector(".jsSelector.rel")
}
var clickToEditAbsXpath = function() {
    var editText = document.querySelector(".absEditButton");
    editText.addEventListener("click", editAbsXpath)
};
var editAbsXpath = function() {
    editSelector(".jsSelector.abs")
}
var clickToEditCss = function() {
    var editText = document.querySelector(".cssEditButton");
    editText.addEventListener("click", editCss)
};
var editCss = function() {
    editSelector(".jsSelector.css")
}
var clickToEditLinkText = function() {
    var editText = document.querySelector(".linkTextEditButton");
    editText.addEventListener("click", editLinkText)
};
var editLinkText = function() {
    editSelector(".jsSelector.linkText")
}
var clickToEditPartialLinkText = function() {
    var editText = document.querySelector(".partialLinkTextEditButton");
    editText.addEventListener("click", editPartialLinkText)
};
var editPartialLinkText = function() {
    editSelector(".jsSelector.partialLinkText")
}
var editSelector = function(selectorToEdit) {
    var selectorValue = document.querySelector(selectorToEdit).innerText;
    var inputBox = document.querySelector(".jsXpath");
    inputBox.focus();
    document.execCommand("selectAll");
    document.execCommand("insertText", !1, selectorValue)
}

function buttonMouseHover(ele, imgSrc) {
    ele.style.outline = "0.01em solid #73bde2f2";
    ele.style.backgroundImage = "url('" + imgSrc + "')"
}

function buttonMouseOut(ele, imgSrc) {
    if (themeName === "dark") {
        imgSrc = imgSrc.replace("grey", "orange")
    }
    ele.style.boxShadow = "";
    ele.style.outline = "";
    ele.style.backgroundImage = "url('" + imgSrc + "')"
}

function selectorContainerMouseHover(ele) {
    if (themeName === "dark") {
        ele.style.backgroundColor = "#6f6868"
    } else {
        ele.style.backgroundColor = "#e3e8ea"
    }
}

function selectorContainerMouseOut(ele) {
    ele.style.backgroundColor = ""
}
var toggleElement = document.querySelector(".toggle-btn");
var buttons = document.querySelectorAll('button');
toggleElement.addEventListener("click", function() {
    if (this.classList.contains("active")) {
        this.classList.remove("active");
        this.classList.add("inactive");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = !0
        }
    } else {
        this.classList.remove("inactive");
        this.classList.add("active");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = !1
        }
    }
    if (this.classList.contains("inactive")) {
        this.setAttribute("title", "click to enable CogniPath");
        var xpathOrCss = 'xpath';
        var onChange = !1;
        var xpath = [xpathOrCss, '', onChange];
        backgroundPageConnection.postMessage({
            name: "highlight-element",
            tabId: chrome.devtools.inspectedWindow.tabId,
            xpath: xpath
        })
    } else {
        this.setAttribute("title", "click to disable CogniPath");
        generateSelectors()
    }
});
classAttr.addEventListener("click", function() {
    generateColoredRelXpath()
});
nameAttr.addEventListener("click", function() {
    generateColoredRelXpath()
});
placeholderAttr.addEventListener("click", function() {
    generateColoredRelXpath()
});
idAttr.addEventListener("click", function() {
    idAttr.checked ? idCheckbox.checked = true : idCheckbox.checked = !1;
    generateColoredRelXpath()
});
idCheckbox.addEventListener("click", function() {
    idCheckbox.checked ? idAttr.checked = true : idAttr.checked = !1;
    generateColoredRelXpath()
});
var captureButton = document.querySelector(".captureButton");
var selectorsBlock = document.querySelector(".selectorsBlock");
var cogniPathEleContainer = document.querySelector("#cogniPathEleContainer");
var multiSelectorDiv = document.querySelector("#multiSelectorDiv");
var insertRow = !1;
captureButton.addEventListener("click", function() {
    var xpathOrCss = document.querySelector(".boxTitle").value.toLocaleLowerCase();
    if (captureButton.className.includes("grey")) {
        captureButton.classList.add("red");
        captureButton.classList.remove("grey");
        captureButton.style.backgroundImage = "url('capture_red.svg')";
        captureButton.title = "click to stop recording and go back to home page."
    } else {
        setElementContainerHeight();
        captureButton.classList.add("grey");
        captureButton.classList.remove("red");
        captureButton.style.backgroundImage = "url('capture_" + iconColor + ".svg')";
        captureButton.title = "click to record multiple selectors."
    }
    selectElements(xpathOrCss, !1);
    if (captureButton.className.includes("red") && toggleElement.classList.contains("active")) {
        document.querySelector(".userFormLink").style.display = "none";
        selectorsBlock.style.display = "none";
        try {
            cogniPathEleContainer.style.display = "none"
        } catch (err) {}
        multiSelectorDiv.style.display = "block";
        chrome.devtools.panels.elements.onSelectionChanged.addListener(function() {
            if (captureButton.className.includes("red") && toggleElement.classList.contains("active")) {
                insertRow = !0;
                var onChange = !1;
                attributeChoicesOption();
                var selector = "";
                var label = "";
                var selectorValue = chrome.devtools.inspectedWindow.eval('generateRelXpath($0, "' + attributeChoices + '")', {
                    useContentScriptContext: !0
                }, function(result) {
                    if (result !== undefined) {
                        xpath = ["xpath", result, onChange];
                        backgroundPageConnection.postMessage({
                            name: "highlight-element",
                            tabId: chrome.devtools.inspectedWindow.tabId,
                            xpath: xpath
                        })
                    }
                    if (addPrefix.className.includes('inactive') || !preCommandInput.value.trim()) {
                        selector = result
                    } else {
                        selector = addPreCommandInSelector(result)
                    }
                });
                var labelName = chrome.devtools.inspectedWindow.eval('generateLabel($0)', {
                    useContentScriptContext: !0
                }, function(result) {
                    var inputBox = document.querySelector(".labelName");
                    if (result === undefined) {
                        result = "It might be child of svg/pseudo/comment/iframe from different src. XPath doesn't support for them."
                    }
                    label = result;
                    if (insertRow && captureButton.className.includes("red") && toggleElement.classList.contains("active") && selector !== undefined) {
                        insRow(label, selector)
                    }
                })
            }
        })
    } else {
        multiSelectorDiv.style.display = "none";
        var xpathOrCss = document.querySelector(".boxTitle").value;
        selectorsBlock.style.display = "";
        cogniPathEleContainer.style.display = ""
    }
});

function insRow(label, selector) {
    var x = document.querySelector('#multiSelectorTable tbody');
    var new_row = x.rows[0].cloneNode(!0);
    new_row.style.display = "";
    var len = x.rows.length;
    var inp1 = new_row.cells[1];
    inp1.id += len;
    inp1.innerHTML = label;
    var inp2 = new_row.cells[2];
    inp2.id += len;
    inp2.innerHTML = selector;
    x.appendChild(new_row);
    insertRow = !1;
    updateTotalRowsCount()
}
document.querySelector('#multiSelectorTable').addEventListener("click", function(ev) {
    var rowIndex = ev.target.parentNode.parentNode.rowIndex;
    if (ev.target.id.includes("delButton")) {
        deleteRow(rowIndex)
    } else if (ev.target.id.includes("row-copy-btn")) {
        var selectorId = ev.target.parentNode.parentNode.querySelector('.selectorValue').id;
        copyToClipboard("#" + selectorId)
    } else if (ev.target.id.includes("row-edit-btn")) {
        var selectorValue = ev.target.parentNode.parentNode.querySelector('.selectorValue').innerText;
        var inputBox = document.querySelector(".jsXpath");
        inputBox.focus();
        document.execCommand("selectAll");
        document.execCommand("insertText", !1, selectorValue)
    }
});

function rowAction(id) {
    var rowButton = document.querySelectorAll("#" + id);
    var totalRows = rowButton.length;
    for (var i = 0; i < totalRows; i++) {
        rowButton[i].addEventListener("click", function() {
            if (id.includes("delButton")) {
                deleteRow(this);
                return
            } else if (id.includes("copy")) {} else if (id.includes("edit")) {}
        })
    }
}

function deleteRow(rowIndex) {
    document.getElementById('multiSelectorTable').deleteRow(rowIndex);
    updateTotalRowsCount()
}
var exportButton = document.querySelector(".exportButton");
exportButton.addEventListener("click", function() {
    exportSelectors("multiSelectorTable", "test")
});
var exportSelectors = (function(table, name) {
    var uri = 'data:application/vnd.ms-excel;base64,',
        template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body><table>{table}</table></body></html>',
        base64 = function(s) {
            return window.btoa(unescape(encodeURIComponent(s)))
        },
        format = function(s, c) {
            return s.replace(/{(\w+)}/g, function(m, p) {
                return c[p]
            })
        };
    if (!table.nodeType) table = document.getElementById(table)
    var ctx = {
        worksheet: name || 'Worksheet',
        table: table.innerHTML
    }
    window.location.href = uri + base64(format(template, ctx))
})
var addPrefix = document.querySelector(".addPrefix");
var preCommandInput = document.querySelector(".pre-command");
var totalCount = document.querySelector(".total-count");
addPrefix.addEventListener("click", function() {
    if (this.classList.contains("inactive")) {
        this.classList.remove("inactive");
        this.classList.add("active");
        this.style.backgroundImage = "url('addPrefix_blue.svg')";
        preCommandInput.style.visibility = "visible"
    } else {
        this.classList.remove("active");
        this.classList.add("inactive");
        this.style.backgroundImage = "url('addPrefix_" + iconColor + ".svg')";
        preCommandInput.style.visibility = "hidden"
    }
});
var settingBtn = document.querySelector(".setting_btn");
var attributeOption = document.querySelector(".attributeOption");
settingBtn.addEventListener("click", function() {
    attributeOption.classList.toggle("show");
    if (attributeOption.classList.contains("show")) {
        settingBtn.style.backgroundImage = "url('setting_blue.svg')";
        attributeOption.style.display = "block"
    } else {
        attributeOption.style.display = "none";
        settingBtn.style.backgroundImage = "url('setting_" + iconColor + ".svg')"
    }
    setElementContainerHeight();
    var h = document.querySelector('body').clientHeight;
    if (attributeOption.style.display.includes("block")) {
        document.querySelector('#multiSelectorDiv').style.height = "calc(100% - 75px)"
    } else {
        document.querySelector('#multiSelectorDiv').style.height = "calc(100% - 50px)"
    }
});

function updateTotalRowsCount() {
    var selectorsCount = document.querySelector(".selectorsCount");
    var totalRows = document.querySelectorAll("tr").length - 2;
    if (totalRows > 0) {
        document.querySelector(".tablePlaceholder").style.display = "none"
    } else {
        document.querySelector(".tablePlaceholder").style.display = ""
    }
    selectorsCount.innerText = "(" + totalRows + ")"
}
window.onclick = function(event) {
    var allCells = document.querySelectorAll("td");
    for (var i = 0; i < allCells.length; i++) {
        allCells[i].scrollLeft = 0
    }
}
setTimeout(function() {
    document.querySelector(".userFormLink").style.display = "none"
}, 40000)