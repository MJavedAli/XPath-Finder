var addAttribute = function(element, attributeName, attributeValue) {
    if (attributeName.includes('xpath')) {
        attributeName = "xpath"
    }
    try {
        element.setAttribute(attributeName, attributeValue)
    } catch (err) {
        return
    }
}
var removeAttribute = function(element, attributeName, onChange) {
    try {
        attributeName = oldAttribute;
        element.removeAttribute(attributeName);
        element.style.outline = ""
    } catch (err) {
        return
    }
}
var oldNodes = [];
var oldAttribute = "";
var allNodes = [];
var idChecked = "";
var _document = "";
var pageUrl = "";
var highlightElements = function(xpathOrCss, xpath, onChange) {
    _document = _document ? _document : document;
    var elements;
    xpathOrCss = xpath === '.' ? 'xpath' : xpathOrCss;
    try {
        if (xpathOrCss.includes("xpath") || xpath === '.') {
            elements = _document.evaluate(xpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
        } else {
            elements = _document.querySelectorAll(xpath)
        }
    } catch (err) {
        if (xpath) {
            chrome.runtime.sendMessage({
                count: "wrongXpath"
            })
        } else {
            chrome.runtime.sendMessage({
                count: "blank"
            })
        }
        for (var i = 0; i < oldNodes.length; i++) {
            removeAttribute(oldNodes[i], xpathOrCss, onChange)
        }
        oldNodes = [];
        allNodes = [];
        return
    }
    var totalMatchFound, node;
    if (xpathOrCss.includes("xpath")) {
        totalMatchFound = elements.snapshotLength
    } else {
        totalMatchFound = elements.length
    }
    for (var i = 0; i < oldNodes.length; i++) {
        removeAttribute(oldNodes[i], xpathOrCss, onChange)
    }
    oldNodes = [];
    allNodes = [];
    chrome.runtime.sendMessage({
        count: totalMatchFound
    });
    for (var i = 0; i < totalMatchFound; i++) {
        if (xpathOrCss.includes("xpath")) {
            node = elements.snapshotItem(i)
        } else {
            node = elements[i]
        }
        if (i === 0 && !(xpath === "/" || xpath === "." || xpath === "/." || xpath === "//." || xpath === "//..")) {
            node.scrollIntoViewIfNeeded()
        }
        oldNodes.push(node);
        oldAttribute = xpathOrCss;
        addAttribute(node, xpathOrCss, i + 1);
        allNodes.push(node.outerHTML)
    }
    chrome.runtime.sendMessage({
        count: allNodes
    });
    if (_document !== document) {
        chrome.runtime.sendMessage({
            count: "iframe"
        });
        var styles = "[xpath], [css]{outline: 2px dotted #0715f7f7 !important}";
        var styleElement = _document.createElement("style");
        styleElement.innerHTML = styles;
        _document.documentElement.appendChild(styleElement);
        styles = '[xpath="1"], [css="1"]{outline:2px dotted #ffa500 !important}';
        styleElement = _document.createElement("style");
        styleElement.innerHTML = styles;
        _document.documentElement.appendChild(styleElement)
    } else {
        chrome.runtime.sendMessage({
            count: "notIframe"
        })
    }
    var url = "websiteUrl-" + document.URL;
    pageUrl = url
};
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    this.tempXpath = "";
    this.indexes = [];
    this.matchIndex = [];
    if (_document) {
        if ((message.xpath || message.xpath === "")) {
            if (message.name.includes("highlight-element")) {
                if (!message.xpath[1]) {
                    message.name = 'xpath'
                } else if (message.xpath[1].charAt(0).includes("/") || message.xpath[1].charAt(0).includes("(") || message.xpath[1].substr(0, 2).includes('./')) {
                    message.name = 'xpath'
                } else {
                    message.name = 'css'
                }
                highlightElements(message.name, message.xpath[1], message.xpath[2])
            }
        }
        if (message.name === "xpath") {
            var ele = _document.querySelector('[xpath="' + message.index + '"]');
            if (ele) {
                ele.style.cssText = 'outline:2px dotted red !important';
                ele.scrollIntoViewIfNeeded()
            }
        }
        if (message.name === "xpath-remove") {
            var ele = _document.querySelector('[xpath="' + message.index + '"]');
            if (ele) {
                ele.style.outline = ""
            }
        }
        if (message.name === "css") {
            var ele = _document.querySelector('[css="' + message.index + '"]');
            if (ele) {
                ele.style.cssText = 'outline:2px dotted red !important';
                ele.scrollIntoViewIfNeeded()
            }
        }
        if (message.name === "css-remove") {
            var ele = _document.querySelector('[css="' + message.index + '"]');
            if (ele) {
                ele.style.outline = ""
            }
        }
        message.xpath = ""
    }
});

function generateLinkText(element) {
    _document = element.ownerDocument;
    if (element.tagName.toLowerCase() === 'a') {
        var linkText = [].reduce.call(element.childNodes, function(a, b) {
            return a + (b.nodeType === 3 ? b.textContent : '')
        }, '').trim();
        var xpath = "//a[text()='" + linkText + "']";
        if (linkText.includes("'")) {
            xpath = '//a[text()="' + linkText + '"]'
        }
        var totalMatch = _document.evaluate(xpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
        if (totalMatch === 1) {
            return linkText
        }
    }
}

function generatePartialLinkText(element) {
    _document = element.ownerDocument;
    if (element.tagName.toLowerCase() === 'a') {
        var linkText = [].reduce.call(element.childNodes, function(a, b) {
            return a + (b.nodeType === 3 ? b.textContent : '')
        }, '').trim();
        if (linkText.length > 5) {
            linkText = linkText.slice(0, (linkText.length - 2)).slice(0, 20)
        }
        var xpath = "//a[contains(text(),'" + linkText + "')]";
        if (linkText.includes("'")) {
            xpath = '//a[contains(text(),"' + linkText + '")]'
        }
        var totalMatch = _document.evaluate(xpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
        if (totalMatch === 1) {
            return linkText
        }
    }
}

function generateAbsXpath(element) {
    if (element.tagName.toLowerCase().includes("style") || element.tagName.toLowerCase().includes("script")) {
        return "This is " + element.tagName.toLowerCase() + " tag. For " + element.tagName.toLowerCase() + " tag, no need to write selector. :P"
    }
    if (element.tagName.toLowerCase() === 'html')
        return '/html[1]';
    if (element.tagName.toLowerCase() === 'body')
        return '/html[1]/body[1]';
    var ix = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];
        if (sibling === element) {
            if (element.tagName.toLowerCase().includes('svg')) {
                var absXpath = generateAbsXpath(element.parentNode) + '/' + '*';
                return absXpath
            } else {
                var absXpath = generateAbsXpath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
                if (absXpath.includes("/*/")) {
                    absXpath = "It might be child of iframe & it is not supported currently."
                }
                return absXpath
            }
        }
        if (sibling.nodeType === 1 && sibling.tagName.toLowerCase() === element.tagName.toLowerCase()) {
            ix++
        }
    }
}
var tempXpath = "";
var indexes = [];
var matchIndex = [];
var containsFlag = !1;

function isInsideIframe(node) {
    var child = !0;
    var frameOrNot = node.ownerDocument;
    while (child) {
        try {
            var temp = frameOrNot.ownerDocument;
            frameOrNot = temp
        } catch (err) {
            child = !1
        }
    }
    return frameOrNot !== document
}

function removeLineBreak(value) {
    if (value) {
        value = value.split('\n')[0].length > 0 ? value.split('\n')[0] : value.split('\n')[1]
    }
    return value
}

function formRelXpath(_document, element) {
    var userAttr = attributeChoicesForXpath[0];
    var innerText = [].reduce.call(element.childNodes, function(a, b) {
        return a + (b.nodeType === 3 ? b.textContent : '')
    }, '').trim().slice(0, 50);
    innerText = removeLineBreak(innerText);
    var tagName = element.tagName.toLowerCase();
    if (tagName.includes("style") || tagName.includes("script")) {
        return "This is " + tagName + " tag. For " + tagName + " tag, no need to write selector. :P"
    }
    if (tagName.includes('svg')) {
        tagName = "*"
    }
    if (innerText.includes("'")) {
        innerText = innerText.split('  ')[innerText.split('  ').length - 1];
        containsText = '[contains(text(),"' + innerText + '")]';
        equalsText = '[text()="' + innerText + '"]'
    } else {
        innerText = innerText.split('  ')[innerText.split('  ').length - 1];
        containsText = "[contains(text(),'" + innerText + "')]";
        equalsText = "[text()='" + innerText + "']"
    }
    if (tagName.includes('html')) {
        return '//html' + this.tempXpath
    }
    var attr = "";
    var attrValue = "";
    var listOfAttr = {};
    if ((!element.getAttribute(userAttr) || userAttr.toLowerCase() === "id") && element.id !== '' && attributeChoicesForXpath.includes("withid")) {
        var id = element.id;
        id = removeLineBreak(id);
        this.tempXpath = '//' + tagName + "[@id='" + id + "']" + this.tempXpath;
        var totalMatch = _document.evaluate(this.tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
        if (totalMatch === 1) {
            return this.tempXpath
        } else {
            if (innerText && element.getElementsByTagName('*').length === 0) {
                var containsXpath = '//' + tagName + containsText;
                var totalMatch = _document.evaluate(containsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                if (totalMatch === 0) {
                    var equalsXpath = '//' + tagName + equalsText;
                    var totalMatch = _document.evaluate(equalsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                    if (totalMatch === 1) {
                        return equalsXpath
                    } else {
                        this.tempXpath = this.tempXpath
                    }
                } else if (totalMatch === 1) {
                    return containsXpath
                } else {
                    this.tempXpath = this.tempXpath
                }
            } else {
                this.tempXpath = this.tempXpath
            }
        }
    } else if (element.attributes.length != 0) {
        if (!attrValue) {
            for (var i = 0; i < element.attributes.length; i++) {
                attr = element.attributes[i].name;
                attrValue = element.attributes[i].nodeValue;
                if (attrValue != null && attrValue != "" && (attr !== "style" || userAttr === "style") && attr !== "id" && attr !== "xpath" && (attributeChoicesForXpath.includes("with" + attr) || userAttr == attr)) {
                    listOfAttr[attr] = attrValue
                }
            }
        }
        if (userAttr in listOfAttr) {
            attr = userAttr;
            attrValue = listOfAttr[attr]
        } else if ("placeholder" in listOfAttr) {
            attr = "placeholder";
            attrValue = listOfAttr[attr]
        } else if ("title" in listOfAttr) {
            attr = "title";
            attrValue = listOfAttr[attr]
        } else if ("value" in listOfAttr) {
            attr = "value";
            attrValue = listOfAttr[attr]
        } else if ("name" in listOfAttr) {
            attr = "name";
            attrValue = listOfAttr[attr]
        } else if ("type" in listOfAttr) {
            attr = "type";
            attrValue = listOfAttr[attr]
        } else if ("class" in listOfAttr) {
            attr = "class";
            attrValue = listOfAttr[attr]
        } else {
            attr = Object.keys(listOfAttr)[0];
            attrValue = listOfAttr[attr]
        }
        attrValue = removeLineBreak(attrValue);
        if (attrValue != null && attrValue != "" && attr !== "xpath") {
            var xpathWithoutAttribute = '//' + tagName + this.tempXpath;
            var xpathWithAttribute = "";
            if (attrValue.includes('  ')) {
                attrValue = attrValue.split('  ')[attrValue.split('  ').length - 1];
                containsFlag = !0
            }
            if (attrValue.includes("'")) {
                if (attrValue.charAt(0) === " " || attrValue.charAt(attrValue.length - 1) === " " || containsFlag) {
                    xpathWithAttribute = '//' + tagName + '[contains(@' + attr + ',"' + attrValue.trim() + '")]' + this.tempXpath
                } else {
                    xpathWithAttribute = '//' + tagName + '[@' + attr + '="' + attrValue + '"]' + this.tempXpath
                }
            } else {
                if (attrValue.charAt(0) === " " || attrValue.charAt(attrValue.length - 1) === " " || containsFlag) {
                    xpathWithAttribute = '//' + tagName + "[contains(@" + attr + ",'" + attrValue.trim() + "')]" + this.tempXpath
                } else {
                    xpathWithAttribute = '//' + tagName + "[@" + attr + "='" + attrValue + "']" + this.tempXpath
                }
            }
            var totalMatch = _document.evaluate(xpathWithAttribute, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
            if (totalMatch === 1) {
                if ((xpathWithAttribute.includes('@href') && !userAttr.includes("href")) || (xpathWithAttribute.includes('@src') && !userAttr.includes("src")) && innerText) {
                    var containsXpath = '//' + tagName + containsText;
                    var totalMatch = _document.evaluate(containsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                    if (totalMatch === 0) {
                        var equalsXpath = '//' + tagName + equalsText;
                        var totalMatch = _document.evaluate(equalsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                        if (totalMatch === 1) {
                            return equalsXpath
                        }
                    } else if (totalMatch === 1) {
                        return containsXpath
                    }
                }
                return xpathWithAttribute
            } else if (innerText) {
                var containsXpath = '//' + tagName + containsText;
                var totalMatch = _document.evaluate(containsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                if (totalMatch === 0) {
                    var equalsXpath = '//' + tagName + equalsText;
                    var totalMatch = _document.evaluate(equalsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                    if (totalMatch === 1) {
                        return equalsXpath
                    } else {
                        this.tempXpath = equalsXpath
                    }
                } else if (totalMatch === 1) {
                    return containsXpath
                } else {
                    containsXpath = xpathWithAttribute + containsText;
                    totalMatch = _document.evaluate(containsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                    if (totalMatch === 0) {
                        var equalsXpath = xpathWithAttribute + equalsText;
                        var totalMatch = _document.evaluate(equalsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                        if (totalMatch === 1) {
                            return equalsXpath
                        }
                    } else if (totalMatch === 1) {
                        return containsXpath
                    } else if (attrValue.includes('/') || innerText.includes('/')) {
                        if (attrValue.includes('/')) {
                            containsXpath = xpathWithoutAttribute + containsText
                        }
                        if (innerText.includes('/')) {
                            containsXpath = containsXpath.replace(containsText, "")
                        }
                        this.tempXpath = containsXpath
                    } else {
                        this.tempXpath = containsXpath
                    }
                }
            } else {
                this.tempXpath = xpathWithAttribute;
                if (attrValue.includes('/')) {
                    this.tempXpath = "//" + tagName + xpathWithoutAttribute
                }
            }
        } else if (innerText) {
            var containsXpath = '//' + tagName + containsText;
            var totalMatch = _document.evaluate(containsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
            if (totalMatch === 0) {
                var equalsXpath = '//' + tagName + equalsText;
                var totalMatch = _document.evaluate(equalsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                if (totalMatch === 1) {
                    return equalsXpath
                }
            } else if (totalMatch === 1) {
                return containsXpath
            }
            this.tempXpath = containsXpath
        } else if ((attrValue == null || attrValue == "" || attr.includes("xpath"))) {
            this.tempXpath = "//" + tagName + this.tempXpath
        }
    } else if (attrValue == "" && innerText && !tagName.includes("script")) {
        var containsXpath = '//' + tagName + containsText + this.tempXpath;
        var totalMatch = _document.evaluate(containsXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
        if (totalMatch === 0) {
            this.tempXpath = '//' + tagName + equalsText + this.tempXpath;
            var totalMatch = _document.evaluate(this.tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
            if (totalMatch === 1) {
                return this.tempXpath
            }
        } else if (totalMatch === 1) {
            return containsXpath
        } else {
            this.tempXpath = containsXpath
        }
    } else {
        this.tempXpath = "//" + tagName + this.tempXpath
    }
    var ix = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];
        if (sibling === element) {
            indexes.push(ix + 1);
            this.tempXpath = formRelXpath(_document, element.parentNode);
            if (!this.tempXpath.includes("/")) {
                return this.tempXpath
            } else {
                var totalMatch = _document.evaluate(this.tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                if (totalMatch === 1) {
                    return this.tempXpath
                } else {
                    this.tempXpath = "/" + this.tempXpath.replace(/\/\/+/g, '/');
                    var regSlas = /\/+/g;
                    var regBarces = /[^[\]]+(?=])/g;
                    while ((match = regSlas.exec(this.tempXpath)) != null) {
                        matchIndex.push(match.index)
                    }
                    for (var j = 0; j < indexes.length; j++) {
                        if (j === 0) {
                            var lastTag = this.tempXpath.slice(matchIndex[matchIndex.length - 1]);
                            if ((match = regBarces.exec(lastTag)) != null) {
                                lastTag = lastTag.replace(regBarces, indexes[j]).split("]")[0] + "]";
                                this.tempXpath = this.tempXpath.slice(0, matchIndex[matchIndex.length - 1]) + lastTag
                            } else {
                                this.tempXpath = this.tempXpath + "[" + indexes[j] + "]"
                            }
                        } else {
                            var lastTag = this.tempXpath.slice(matchIndex[matchIndex.length - (j + 1)], matchIndex[matchIndex.length - (j)]);
                            if ((match = regBarces.exec(lastTag)) != null) {
                                lastTag = lastTag.replace(regBarces, indexes[j]);
                                this.tempXpath = this.tempXpath.slice(0, matchIndex[matchIndex.length - (j + 1)]) + lastTag + this.tempXpath.slice(matchIndex[matchIndex.length - j])
                            } else {
                                this.tempXpath = this.tempXpath.slice(0, matchIndex[matchIndex.length - j]) + "[" + indexes[j] + "]" + this.tempXpath.slice(matchIndex[matchIndex.length - j])
                            }
                        }
                        var totalMatch = _document.evaluate(this.tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                        if (totalMatch === 1) {
                            var regSlashContent = /([a-zA-Z])([^/]*)/g;
                            var length = this.tempXpath.match(regSlashContent).length;
                            for (var k = j + 1; k < length - 1; k++) {
                                var lastTag = this.tempXpath.match(/\/([^\/]+)\/?$/)[1];
                                var arr = this.tempXpath.match(regSlashContent);
                                arr.splice(length - k, 1, '/');
                                var relXpath = "";
                                for (var i = 0; i < arr.length - 1; i++) {
                                    if (arr[i]) {
                                        relXpath = relXpath + "/" + arr[i]
                                    } else {
                                        relXpath = relXpath + "//" + arr[i]
                                    }
                                }
                                relXpath = (relXpath + "/" + lastTag).replace(/\/\/+/g, '//');
                                relXpath = relXpath.replace(/\/\/+/g, '/');
                                relXpath = relXpath.replace(/\/+/g, "//");
                                var totalMatch = _document.evaluate(relXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                                if (totalMatch === 1) {
                                    this.tempXpath = relXpath
                                }
                            }
                            return this.tempXpath.replace('//html', '')
                        }
                    }
                }
            }
        }
        if (sibling.nodeType === 1 && sibling.tagName.toLowerCase() === element.tagName.toLowerCase()) {
            ix++
        }
    }
}
var attributeChoicesForXpath = [];

function generateRelXpath(element, attributeChoices) {
    attributeChoicesForXpath = attributeChoices.split(",");
    _document = element.ownerDocument;
    let relXpath = formRelXpath(_document, element);
    let doubleForwardSlash = /\/\/+/g;
    let numOfDoubleForwardSlash = 0;
    try {
        numOfDoubleForwardSlash = relXpath.match(doubleForwardSlash).length
    } catch (err) {}
    if (numOfDoubleForwardSlash > 1 && relXpath.includes('[') && !relXpath.includes('@href') && !relXpath.includes('@src')) {
        relXpath = optimizeXpath(_document, relXpath)
    }
    if (relXpath === undefined) {
        relXpath = "It might be child of svg/pseudo/comment/iframe from different src. XPath doesn't support for them."
    }
    this.tempXpath = "";
    return relXpath
}

function optimizeXpath(_document, xpath) {
    let xpathDiv = xpath.split("//");
    let leng = xpathDiv.length;
    var regBarces = /[^[\]]+(?=])/g;
    let bracesContentArr = xpath.match(regBarces);
    let startOptimizingFromHere = 1;
    for (let j = bracesContentArr.length - 1; j > 0; j--) {
        startOptimizingFromHere++;
        if (bracesContentArr[j].length > 3) {
            startOptimizingFromHere = startOptimizingFromHere;
            break
        }
    }
    let tempXpath = xpath.split("//" + xpathDiv[leng - startOptimizingFromHere])[1];
    let totalMatch = 0;
    try {
        totalMatch = _document.evaluate(tempXpath, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength
    } catch (err) {
        return xpath
    }
    if (totalMatch === 1) {
        return tempXpath
    }
    for (let i = leng - startOptimizingFromHere; i > 0; i--) {
        let temp = xpath.replace("//" + xpathDiv[i], "");
        try {
            totalMatch = _document.evaluate(temp, _document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
            if (totalMatch === 1) {
                xpath = temp
            }
        } catch (err) {
            return xpath
        }
    }
    return xpath
}

function getNodename(element) {
    var name = "",
        className;
    if (element.classList.length) {
        name = [element.tagName.toLowerCase()];
        className = element.className.trim();
        className = className.replace(/  +/g, ' ');
        name.push(className.split(" ").join("."));
        name = name.join(".")
    }
    return name
}

function getChildNumber(node) {
    var classes = {},
        i, firstClass, uniqueClasses;
    var parentNode = node.parentNode,
        childrenLen;
    childrenLen = parentNode.children.length;
    for (i = 0; i < childrenLen; i++) {
        if (parentNode.children[i].classList.length) {
            firstClass = parentNode.children[i].classList[0];
            if (!classes[firstClass]) {
                classes[firstClass] = [parentNode.children[i]]
            } else {
                classes[firstClass].push(parentNode.children[i])
            }
        }
    }
    uniqueClasses = Object.keys(classes).length || -1;
    var obj = {
        childIndex: -1,
        childLen: childrenLen
    }
    if (classes[Object.keys(classes)[0]] === childrenLen) {
        obj.childIndex = Array.prototype.indexOf.call(classes[node.classList[0]], node);
        obj.childLen = classes[Object.keys(classes)[0]].length;
        return obj
    } else if (uniqueClasses && uniqueClasses !== -1 && uniqueClasses !== childrenLen) {
        obj.childIndex = Array.prototype.indexOf.call(parentNode.children, node);
        obj.childLen = classes[Object.keys(classes)[0]].length;
        return obj
    } else if (uniqueClasses === -1) {
        obj.childIndex = Array.prototype.indexOf.call(parentNode.children, node);
        obj.childLen = childrenLen;
        return obj
    } else {
        return obj
    }
}

function parents(element, _array) {
    var name, index;
    if (_array === undefined) {
        _array = []
    } else {
        index = getChildNumber(element);
        name = getNodename(element);
        if (name) {
            if (index.childLen >= 1 && index.childIndex !== -1) {
                name += ":nth-child(" + (index.childIndex + 1) + ")"
            }
            _array.push(name)
        } else if (_array.length < 5) {
            name = element.tagName.toLowerCase();
            if (index.childIndex !== -1) {
                name += ":nth-child(" + (index.childIndex + 1) + ")"
            }
            _array.push(name)
        }
    }
    if (element.tagName !== 'BODY') return parents(element.parentNode, _array);
    else return _array
}

function generateCSS(el) {
    if (!el) {
        return "element is inside iframe & it is not supported by ChroPath currently. Please write CSS manually."
    }
    var tagName = el.tagName.toLowerCase();
    if (tagName.includes("style") || tagName.includes("script") || tagName.includes("svg")) {
        return "This is " + tagName + " tag. For " + tagName + " tag, no need to write selector. :P"
    }
    if (el.id !== '') {
        return "#" + el.id
    }
    var path = parents(el, []);
    path = path.reverse();
    var lastNode = path.slice(path.length - 1, path.length);
    var _path = path.slice(0, path.length - 1);
    var cssSelector = "";
    if (_path.length != 0) {
        cssSelector = _path.join(" ") + " > " + lastNode
    } else {
        cssSelector = lastNode
    }
    try {
        var elements = _document.querySelectorAll(cssSelector);
        if (elements.length == 1) {
            return cssSelector
        }
    } catch (err) {}
}

function insertPseudoElementInIframes() {
    var iframes = document.querySelectorAll("iframe");
    for (var i = 0; i < iframes.length; i++) {
        var _document = iframes[i].contentDocument;
        if (_document) {
            var x = _document.createElement("input");
            x.style.display = "none";
            x.setAttribute('id', 'chropathFrame' + i);
            var bodyEle = _document.querySelector('body');
            bodyEle.appendChild(x)
        }
    }
}

function deletePseudoElementFromIframes() {
    var iframes = document.querySelectorAll("iframe");
    for (var i = 0; i < iframes.length; i++) {
        if (iframes[i].contentDocument) {
            var ele = iframes[i].contentDocument.querySelector('#chropathFrame' + i);
            ele.parentNode.removeChild(ele)
        }
    }
}

function generateLabel(element) {
    _document = element.ownerDocument;
    var insideIframe = _document !== document ? "(inside iframe)" : "";
    var attr = "";
    var attrValue = "";
    var listOfAttr = {};
    var label = "";
    var tagName = element.tagName.toLowerCase();
    tagName = tagName.includes("pseudo") ? "pseudo" : tagName;
    if ((tagName.includes('input') || tagName.includes('textarea')) && element.id) {
        try {
            label = _document.querySelector("label[for='" + element.id + "']").textContent;
            label = label.replace(/ /g, "");
            return label + insideIframe
        } catch (err) {}
    } else if (tagName.includes('style') || tagName.includes('script') || tagName.includes('pseudo') || tagName.includes('svg') || tagName.includes('path') || tagName.includes('body') || tagName.includes('html') || tagName.includes('head') || tagName.includes('link') || tagName.includes('meta') || tagName.includes('title')) {
        try {
            label = tagName + "Tag";
            label = label.replace(/ /g, "");
            return label + insideIframe
        } catch (err) {}
    }
    if (tagName.includes('label')) {
        label = [].reduce.call(element.childNodes, function(a, b) {
            return a + (b.nodeType === 3 ? b.textContent : '')
        }, '').trim().slice(0, 50)
    } else if (element.attributes.length != 0) {
        if (!attrValue) {
            for (var i = 0; i < element.attributes.length; i++) {
                attr = element.attributes[i].name;
                attrValue = element.attributes[i].nodeValue;
                if (attrValue != null && attrValue != "" && !attr.includes("style") && !attr.includes("id") && !attr.includes("xpath")) {
                    listOfAttr[attr] = attrValue
                }
            }
        }
        attr = "";
        attrValue = "";
        if ("placeholder" in listOfAttr) {
            attr = "placeholder";
            attrValue = listOfAttr[attr]
        } else if ("name" in listOfAttr) {
            attr = "name";
            attrValue = listOfAttr[attr]
        } else if ("value" in listOfAttr) {
            attr = "value";
            attrValue = listOfAttr[attr]
        } else if ("aria-label" in listOfAttr) {
            attr = "aria-label";
            attrValue = listOfAttr[attr]
        } else if ("title" in listOfAttr) {
            attr = "title";
            attrValue = listOfAttr[attr]
        } else if ("alt" in listOfAttr) {
            attr = "alt";
            attrValue = listOfAttr[attr]
        } else if ("for" in listOfAttr) {
            attr = "for";
            attrValue = listOfAttr[attr]
        } else if ("data-label" in listOfAttr) {
            attr = "data-label";
            attrValue = listOfAttr[attr]
        } else if ("date-fieldlabel" in listOfAttr) {
            attr = "date-fieldlabel";
            attrValue = listOfAttr[attr]
        } else if ("data-displaylabel" in listOfAttr) {
            attr = "data-displaylabel";
            attrValue = listOfAttr[attr]
        } else if ("role" in listOfAttr) {
            attr = "role";
            attrValue = listOfAttr[attr]
        }
        label = attrValue.slice(0, 30)
    }
    if (!label || label.length < 3) {
        label = [].reduce.call(element.childNodes, function(a, b) {
            return a + (b.nodeType === 3 ? b.textContent : '')
        }, '').trim().slice(0, 50)
    }
    if (!label) {
        label = tagName + "Tag"
    }
    label = label.replace(/ /g, "");
    return label + insideIframe
}