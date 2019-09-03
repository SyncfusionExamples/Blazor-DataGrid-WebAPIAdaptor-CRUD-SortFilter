// This file is to show how a library package may provide JavaScript interop features
// wrapped in a .NET API

function getElementByXpath(xPath) {
    return document.evaluate(xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

(function (ejs) {
    window.ejsBase = ejs;
})({

    getAttribute: function (xPath, propName) {
        return getElementByXpath(xPath).getAttribute(propName);
    },

    setAttribute: function (xPath, propName, value) {
        getElementByXpath(xPath).setAttribute(propName, value);
    },

    addClass: function (xPath, classList) {
        ejs.base.addClass([getElementByXpath(xPath)], classList);
    },

    removeClass: function (xPath, classList) {
        ejs.base.removeClass([getElementByXpath(xPath)], classList);
    },

    getClassList: function (xPath) {
        return Array.prototype.slice.call(getElementByXpath(xPath).classList);
    },

    enableRipple: function (isRipple) {
        ejs.base.enableRipple(isRipple);
    },

    enableRtl: function (status) {
        ejs.base.enableRtl(status);
    },

    loadCldr: function (...cultureData) {
        for (var i = 0; i < cultureData.length; i++) {
            ejs.base.loadCldr(JSON.parse(cultureData[i]));
        }
    },

    setCulture: function (cultureName) {
        ejs.base.setCulture(cultureName);
    },

    setCurrencyCode: function (currencyCode) {
        ejs.base.setCurrencyCode(currencyCode);
    },

    load: function (localeObject) {
        ejs.base.L10n.load(JSON.parse(localeObject));
    }
});

window.ejsIntrop = {
    createXPathFromElement: function (elm) {
        var allNodes = document.getElementsByTagName('*');
        for (var segs = []; elm && elm.nodeType === 1; elm = elm.parentNode) {
            if (elm.hasAttribute('id')) {
                var uniqueIdCount = 0;
                for (var n = 0; n < allNodes.length; n++) {
                    if (allNodes[n].hasAttribute('id') && allNodes[n].id === elm.id) uniqueIdCount++;
                    if (uniqueIdCount > 1) break;
                };
                if (uniqueIdCount === 1) {
                    segs.unshift('id("' + elm.getAttribute('id') + '")');
                    return segs.join('/');
                } else {
                    segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]');
                }
            } else if (elm.hasAttribute('class')) {
                segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]');
            } else {
                for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
                    if (sib.localName === elm.localName) i++;
                }
                segs.unshift(elm.localName.toLowerCase() + '[' + i + ']');
            }
        }
        return segs.length ? '/' + segs.join('/') : null;
    },

    invokeEJS: function (id, options, events, nameSpace, dotnet, bindableProps) {
        try {
            if (!window.BlazorAdaptor) {
                window.ejsIntrop.initBlazorAdaptor();
            }
            options = JSON.parse(options, ejsIntrop.parseRevive);
            var type = ejs.base.getValue(nameSpace, window);
            window.ejsIntrop.bindEvents(options, events, dotnet);
            var comp = new type(options);
            comp._dotnetInstance = dotnet;
            var change = comp.saveChanges;
            comp._saveChanges = change.bind(comp);
            comp.bindableProps = bindableProps;
            comp.isRendered = false;
            comp.saveChanges = window.ejsIntrop.updateModel.bind(comp);
            if (comp.dataSource) {
                comp.dataSource["dotnetInstance"] = dotnet;
            }
            comp.appendTo("#" + id);
            comp.isRendered = true;
        }
        catch (e) {
            window.ejsIntrop.throwError(e, comp);
        }
    },

    setModel: function (id, options, events, nameSpace, dotnet) {
        try {
            options = JSON.parse(options, ejsIntrop.parseRevive);
            window.ejsIntrop.bindEvents(options, events, dotnet);
            var comp = document.getElementById(id).ej2_instances[0];
            comp.preventUpdate = true;
            if (comp.stringifiedKey && typeof options[comp.stringifiedKey] === "string") {
                options[comp.stringifiedKey] = JSON.parse(options[comp.stringifiedKey]);
            }
            if (options.dataSource) {
                options.dataSource["dotnetInstance"] = dotnet;
            }
            comp.setProperties(options);
            comp.dataBind();
        }
        catch (e) {
            window.ejsIntrop.throwError(e, comp);
        }
    },

    updateModel: async function (key, newValue, oldValue) {
        try {
            this._saveChanges(key, newValue, oldValue);
            var propertyNames = Object.keys(this.bindableProps);
            if (this.isRendered && !this.preventUpdate && ejsIntrop.compareValues(newValue, oldValue) && propertyNames && propertyNames.indexOf(key) !== -1) {
                var newObj = {};
                if (typeof newValue === "object" && newValue!= null && !(newValue instanceof Date)) {
                    newValue = JSON.stringify(newValue);
                    this.stringifiedKey = key;
                }
                newObj[key] = newValue;
                await this._dotnetInstance.invokeMethodAsync('UpdateModel', newObj);
            }
            this.preventUpdate = false;
        }
        catch (e) {
            window.ejsIntrop.throwError(e, this);
        }
    },


    call: function (id, methodName, arg, nameSpace, dotnet) {
        try {
            var comp = document.getElementById(id).ej2_instances[0];
            comp[methodName].apply(comp, arg);
        }
        catch (e) {
            window.ejsIntrop.throwError(e, comp);
        }
    },

    parseRevive: function (key, value) {
        var dateRegex = new RegExp(/(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2}).*/);
        if (typeof value === "string" && key === "query") {
            return eval(value);
        }
        else if (key === "dataSource") {
            value = typeof value === "string" ? JSON.parse(value) : value;
            if (!value.adaptor) {
                return value;
            }
            value.adaptor = ejsIntrop.getAdaptor(value.adaptor);
            value.offline = false;
            return new ej.data.DataManager(value);
        }
        else if (typeof value === "string" && dateRegex.test(value)) {
            return new Date(value);
        }
        else if (typeof value === "string") {
            return ejsIntrop.escapeChar(value);
        }

        return value;
    },

    escapeChar: function (str) {
        return str.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
    },

    triggerEJEvents: function (arg) {
        try {
            if (arg) {
                this.dotnet.invokeMethodAsync("Trigger", this.eventName, window.ejsIntrop.cleanStringify(arg));
            } else {
                this.dotnet.invokeMethodAsync("Trigger", this.eventName, '');
            }
        }
        catch (e) {
            window.ejsIntrop.throwError(e, this);
        }
    },

    cleanStringify: function (object) {
        if (object && typeof object === 'object') {
            object = copyWithoutCircularReferences([object], object);
        }
        return JSON.stringify(object);

        function copyWithoutCircularReferences(references, object) {
            var cleanObject = {};
            Object.keys(object).forEach(function (key) {
                var value = object[key];
                if (value instanceof Node) {
                    var nodeValue = Object.assign({}, value);
                    delete nodeValue.ej2_instances;
                    cleanObject[key] = {
                        id: value.id,
                        class: value.className,
                        ele: nodeValue,
                        xpath: window.ejsIntrop.createXPathFromElement(value)
                    };
                }
                else if (value && Array.isArray(value)) {
                    for (var i = 0; i < value.length; i++) {
                        if (!cleanObject[key]) cleanObject[key] = [];
                        if (value[i] && typeof value[i] === 'object' && !(value[i] instanceof Date)) {
                            cleanObject[key].push(copyWithoutCircularReferences(references, value[i]));
                        }
                        else {
                            cleanObject[key].push(value[i]);
                        }
                    }
                }
                else if (value && typeof value === 'object') {
                    var keyColl = []; // To ignore child property
                    keyColl = Object.keys(value);
                    if (keyColl.indexOf('parentObj') > -1) {
                        value = value['properties'];
                    }
                    if (references.indexOf(value) < 0) {
                        references.push(value);
                        if (value && value instanceof Date) {
                            cleanObject[key] = value;
                        } else {
                            cleanObject[key] = copyWithoutCircularReferences(references, value);
                        }
                        references.pop();
                    } else {
                        cleanObject[key] = '###_Circular_###';
                    }
                }
                else if (typeof value !== 'function') {
                    cleanObject[key] = value;
                }
            });
            return cleanObject;
        }
    },

    bindEvents: function (modelObj, events, dotnet) {
        if (events) {
            for (var i = 0; i < events.length; i = i + 1) {
                var curEvent = events[i];
                var scope = { dotnet: dotnet, eventName: curEvent };
                if (curEvent.indexOf('.') > 0) {
                    var items = curEvent.split('.');
                    var currentObject = modelObj;
                    for (var j = 0; j < items.length - 1; j++) {
                        currentObject = currentObject[items[j]];
                    }
                    currentObject[items[items.length - 1]] = window.ejsIntrop.triggerEJEvents.bind(scope);
                } else {
                    modelObj[curEvent] = window.ejsIntrop.triggerEJEvents.bind(scope);
                }
            }
        }
    },

    throwError: function (e, comp) {
        // comp._dotnetInstance.invokeMethodAsync("ErrorHandling", e.message, e.stack);
        console.error(e.message + "\n" + e.stack);
    },

    compareValues: function (newValue, oldValue) {
        if (newValue instanceof Date && oldValue instanceof Date) {
            return +newValue !== +oldValue;
        }
        else if (typeof newValue === "object" && typeof oldValue === "object") {
            if ((newValue && newValue.dotnetInstance) && (oldValue && oldValue.dotnetInstance)) return false;
            return JSON.stringify(newValue) !== JSON.stringify(oldValue);
        }
        return newValue !== oldValue;
    },

    getAdaptor: function (adaptor) {
        var adaptorObject;
        switch (adaptor) {
            case "ODataAdaptor":
                adaptorObject = new ejs.data.ODataAdaptor();
                break;
            case "ODataV4Adaptor":
                adaptorObject = new ejs.data.ODataV4Adaptor();
                break;
            case "UrlAdaptor":
                adaptorObject = new ejs.data.UrlAdaptor();
                break;
            case "WebApiAdaptor":
                adaptorObject = new ejs.data.WebApiAdaptor();
                break;
            case "JsonAdaptor":
                adaptorObject = new ejs.data.JsonAdaptor();
                break;
            default:
                adaptorObject = new window.BlazorAdaptor();
                break;
        }
        return adaptorObject;
    },

    initBlazorAdaptor: function () {
        window.BlazorAdaptor = class BlazorAdaptor extends ejs.data.UrlAdaptor {
            processQuery(dm, query, hierarchyFilters) {
                var request = ej.data.UrlAdaptor.prototype.processQuery.apply(this, arguments);
                request.dotnetInstance = dm.dotnetInstance;
                return request;
            }
            makeRequest(request, deffered, args, query) {
                var process = function (data, aggregates, virtualSelectRecords) {
                    var args = {};
                    args.count = data.count ? parseInt(data.count.toString(), 10) : 0;
                    args.result = data.result ? data.result : data;
                    args.aggregates = aggregates;
                    args.virtualSelectRecords = virtualSelectRecords;
                    deffered.resolve(args);
                };
                var dm = JSON.parse(request.data);
                var proxy = this;
                request.dotnetInstance.invokeMethodAsync("DataProcess", dm).then(data => {
                    data = ej.data.DataUtil.parse.parseJson(data);
                    var pResult = proxy.processResponse(data, {}, query, null, request);
                    process(pResult);
                    return;
                });
            }
            insert(dm, data, tableName, query) {
                var args = {};
                args.dm = dm;
                args.data = data;
                args.tableName = tableName;
                args.query = query;
                args.requestType = "insert";
                return args;
            }
            remove(dm, keyField, value, tableName, query) {
                var args = {};
                args.dm = dm;
                args.data = value;
                args.keyField = keyField;
                args.tableName = tableName;
                args.query = query;
                args.requestType = "remove";
                return args;
            }
            update(dm, keyField, value, tableName, query) {
                var args = {};
                args.dm = dm;
                args.data = value;
                args.keyField = keyField;
                args.tableName = tableName;
                args.query = query;
                args.requestType = "update";
                return args;
            }
            batchRequest(dm, changes, e, query, original) {
                var args = {};
                args.dm = dm;
                args.changed = changes.changedRecords;
                args.added = changes.addedRecords;
                args.deleted = changes.deletedRecords;
                args.requestType = "batchsave";
                args.keyField = e.key;
                return args;
            }
            doAjaxRequest(args) {
                var defer = new ej.data.Deferred();
                var dm = args.dm;
                if (args.requestType === "insert") {
                    dm.dotnetInstance.invokeMethodAsync('Insert', JSON.stringify(args.data)).then(data => {
                        defer.resolve(data);
                    });
                }
                if (args.requestType === "remove") {
                    dm.dotnetInstance.invokeMethodAsync('Remove', JSON.stringify(args.data), args.keyField).then(data => {
                        defer.resolve();
                    });
                }
                if (args.requestType === "update") {
                    dm.dotnetInstance.invokeMethodAsync('Update', JSON.stringify(args.data), args.keyField).then(data => {
                        var record = ej.data.DataUtil.parse.parseJson(data);
                        defer.resolve(record);
                    });
                }
                if (args.requestType === "batchsave") {
                    dm.dotnetInstance.invokeMethodAsync('BatchUpdate', JSON.stringify(args.changed), JSON.stringify(args.added), JSON.stringify(args.deleted), args.keyField).then(data => {
                        defer.resolve(data);
                    });
                }
                return defer.promise;
            }
        };
    }
};
