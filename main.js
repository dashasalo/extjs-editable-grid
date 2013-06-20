Ext.onReady(function () {
    Ext.QuickTips.init();
    Ext.form.Field.prototype.msgTarget = 'side';

    Ext.customInputPanel = Ext.extend(Ext.grid.EditorGridPanel, {
        initialData: [],
        data: [],

        config: {
            fieldList: [],
            columnList: [],
            columnWidth: [],
            addPic: '',
            delPic: '',
            outputFormat: 'OLDPRICES',
            startMinValue: 0
        },

        convertTableToString: function () {
            var resultString = "";
            var resultArray = [];
            var bufArray = [];

            this.stopEditing(false);
            for (var i = 0; i < this.store.data.items.length; i++) {
                bufArray = [];
                for (var j = 1, cmp; j < this.store.data.items[i].fields.items.length - 1; j++) {
                    var cmp = this.config.fieldList[j - 1];
                    bufArray.push(((this.store.data.items[i].data[this.store.data.items[i].fields.items[j].name]) * 1).toFixed(cmp.trailingDecimals) + '');
                }
                resultArray.push(bufArray.join('-'));
            }
            resultString = resultArray.join(' ');

            return resultString;
        },

        onDeleteRecord: function (pCode) {
            this.store.removeAt(this.store.findExact('idfield', pCode * 1));
            return false;
        },

        reset: function () {
            this.data = this.initialData;
            this.store.loadData(this.data);
        },

        refresh: function () {
            this.getView().refresh();
        },

        onAddRecord: function () {
            var panel = this.findParentByType('customInputPanel');
            var components = panel.getBottomToolbar().items.items;
            var ranges = [];

            for (var i = 0; i < components.length - 1; i++) {
                if (components[i].range != false) {
                    if (components[i].rangeStart) {
                        ranges[components[i].range] = components[i].getValue();
                    } else {
                        components[i].minValue = ranges[components[i].range];
                    }
                }

                if ((components[i].isValid) && (!components[i].isValid())) {
                    return false;
                }
            }

            var maxId = 0;
            for (var i = 0; i < panel.store.data.items.length; i++) {
                if (panel.store.data.items[i].data.idfield > maxId) {
                    maxId = panel.store.data.items[i].data.idfield;
                }
            }

            var record = {};
            record['idfield'] = maxId + 1;
            for (var i = 0, cmp; i < components.length - 1; i++) {
                cmp = components[i];
                record['field' + i] = cmp.getValue();
                cmp.reset();
            }
            record['deleteIcon'] = '';

            var r = new panel.store.recordType(record);
            r.commit();
            panel.store.add(r);
            panel.store.sort('field0', 'ASC');
        },

        deleteColRenderer: function (pPanel, pRecord) {
            return '<div onClick="Ext.getCmp(\'' + pPanel.id + '\').onDeleteRecord(\'' + pRecord.data.idfield + '\'); return false;" OnMouseOver="var el = this.getElementsByTagName(\'table\')[0]; el.className = el.className.replace(\' x-btn-over\',\'\') + \' x-btn-over\';" OnMouseOut="var el = this.getElementsByTagName(\'table\')[0]; el.className = el.className.replace(\' x-btn-over\',\'\');"><table cellspacing="0" class="x-btn  x-btn-icon"><tbody class="x-btn-small x-btn-icon-small-left"><tr><td class="x-btn-tl"><i>&nbsp;</i></td><td class="x-btn-tc"></td><td class="x-btn-tr"><i>&nbsp;</i></td></tr><tr><td class="x-btn-ml"><i>&nbsp;</i></td><td class="x-btn-mc"><em unselectable="on" class=""><button type="button" class="x-btn-text " style="background-image: url(&quot;' + pPanel.config.delPic + '&quot;);">&nbsp;</button></em></td><td class="x-btn-mr"><i>&nbsp;</i></td></tr><tr><td class="x-btn-bl"><i>&nbsp;</i></td><td class="x-btn-bc"></td><td class="x-btn-br"><i>&nbsp;</i></td></tr></tbody></table></div>';
        },

        checkWarning: function (obj, value, metaData, record, rowIndex, colIndex, store) {
            var comp = obj.config.fieldList[colIndex];
            var rangeMin = comp.minValue;

            if ((comp) && (comp.range) && (comp.rangeEnd)) {
                if ((obj.config.fieldList[colIndex - 1]) && (obj.config.fieldList[colIndex - 1].range == comp.range) && (obj.config.fieldList[colIndex - 1].rangeStart)) {
                    rangeMin = record.data['field' + (colIndex - 1)];
                }
            }

            if ((comp) && (comp.range) && (comp.rangeStart)) {
                if ((obj.config.fieldList[colIndex + 1]) && (obj.config.fieldList[colIndex + 1].range == comp.range) && (obj.config.fieldList[colIndex + 1].rangeEnd)) {
                    if (store.data.items[rowIndex - 1]) {
                        if (store.data.items[rowIndex].data['field' + colIndex] * 1 < store.data.items[rowIndex - 1].data['field' + (colIndex + 1)] * 1) {
                            return '<div class="processed-row">' + (value * 1).toFixed(comp.trailingDecimals) + '</div>';
                        }
                    }
                }
            }

            if (((comp.minValue) && (comp.minValue > value * 1)) || (rangeMin > value * 1)) {
                return '<div class="processed-row">' + (value * 1).toFixed(comp.trailingDecimals) + '</div>';
            } else {
                return (value * 1).toFixed(comp.trailingDecimals);
            }
        },

        isValid: function () {
            this.stopEditing(false);

            if (this.convertTableToString() == '') return 1;

            if (this.store.data.items[0]) {
                var firstValue = this.store.data.items[0].data[this.store.data.items[0].fields.items[1].name];
                if (firstValue * 1 != this.config.startMinValue) {
                    return 2;
                }
            }

            for (var i = 0, val = '', el; i < this.store.data.items.length; i++) {
                for (var j = 1, elemIndex = 0; j < this.store.data.items[i].fields.items.length - 1; j++) {
                    val = this.store.data.items[i].data[this.store.data.items[i].fields.items[j].name];
                    elemIndex = j - 1;
                    el = this.config.fieldList[elemIndex];

                    var rangeMin = el.minValue;

                    if ((el.range) && (el.rangeEnd)) {
                        if ((this.config.fieldList[elemIndex - 1]) && (this.config.fieldList[elemIndex - 1].range == el.range) && (this.config.fieldList[elemIndex - 1].rangeStart)) {
                            rangeMin = this.store.data.items[i].data[this.store.data.items[i].fields.items[j - 1].name];
                        }
                    }

                    if ((el) && (el.range) && (el.rangeStart)) {
                        if ((this.config.fieldList[elemIndex + 1]) && (this.config.fieldList[elemIndex + 1].range == el.range) && (this.config.fieldList[elemIndex + 1].rangeEnd)) {
                            if (this.store.data.items[i - 1]) {
                                if (this.store.data.items[i].data['field' + elemIndex] * 1 < this.store.data.items[i - 1].data['field' + (elemIndex + 1)] * 1) {
                                    return 4;
                                }
                            }
                        }
                    }

                    if (((el.minValue) && (val * 1 < el.minValue)) || (rangeMin * 1 > val * 1)) {
                        return 3;
                    }
                }
            }
            return 0;
        },

        afterRenderEvent: function () {
            Ext.query("#" + this.getId() + " .x-btn")[0].className = Ext.query("#" + this.getId() + " .x-btn")[0].className + ' x-btn-over';
            Ext.query("#" + this.getId() + " .x-toolbar")[0].setAttribute('style', 'padding:5px 3px !important; border:0  ');
            Ext.query("#" + this.getId())[0].setAttribute('style', 'border:1px solid #b4b8c8 !important; ');
        },

        constructor: function (config) {
            if (config.data != undefined) this.data = config.data;
            if (config.config.fieldList != undefined) this.config.fieldList = config.config.fieldList;
            if (config.config.columnList != undefined) this.config.columnList = config.config.columnList;
            if (config.config.columnWidth != undefined) this.config.columnWidth = config.config.columnWidth;
            if (config.config.addPic != undefined) this.config.addPic = config.config.addPic;
            if (config.config.delPic != undefined) this.config.delPic = config.config.delPic;
            if (config.config.outputFormat != undefined) this.config.outputFormat = config.config.outputFormat;
            if (config.config.startMinValue != undefined) this.config.startMinValue = config.config.startMinValue;

            Ext.customInputPanel.superclass.constructor.call(this, config);
        },

        /* Component initialization */
        initComponent: function () {
            var self = this;

            var storeFields = [];
            var gridColumns = [];
            var bbarFields = [];

            storeFields.push({
                name: 'idfield'
            });

            var fixedPrecisionNumberField = Ext.extend(Ext.form.NumberField, {
                setValue: function (v) {
                    v = typeof v == 'number' ? v : String(v).replace(this.decimalSeparator, ".");
                    v = isNaN(v) ? '' : String(v).replace(".", this.decimalSeparator);
                    v = isNaN(v) ? '' : this.fixPrecision(String(v).replace(".", this.decimalSeparator));
                    return Ext.form.NumberField.superclass.setValue.call(this, v);
                }
            });

            for (var i = 0, comp, range, rangeStart, rangeEnd; i < this.config.fieldList.length; i++) {
                comp = this.config.fieldList[i];
                storeFields.push({
                    name: 'field' + i
                });

                range = false;
                rangeStart = false;
                rangeEnd = false;
                if (comp.range) {
                    range = comp.range;
                    if (comp.rangeStart) rangeStart = comp.rangeStart;
                    if (comp.rangeEnd) rangeEnd = comp.rangeEnd;
                }
                switch (comp.fieldType) {
                    case 'text':
                        gridColumns.push({
                            resizable: false,
                            fixed: true,
                            header: this.config.columnList[i].title,
                            width: this.config.columnWidth[i],
                            dataIndex: 'field' + i,
                            menuDisabled: true,
                            align: 'right',
                            editor: new Ext.form.TextField({
                                allowBlank: false
                            })
                        });
                        bbarFields.push({
                            xtype: 'textfield',
                            width: comp.width,
                            emptyText: comp.emptyText,
                            allowBlank: comp.allowBlank,
                            hideLabel: comp.hideLabel,
                            fieldLabel: comp.fieldLabel,
                            minLength: comp.minLength,
                            maxLength: comp.maxLength,
                            style: 'margin-right:10px'
                        });
                        break;

                    case 'number':
                        gridColumns.push({
                            header: this.config.columnList[i].title,
                            width: this.config.columnWidth[i],
                            dataIndex: 'field' + i,
                            menuDisabled: true,
                            align: 'right',
                            resizable: false,
                            fixed: true,
                            editor: new fixedPrecisionNumberField({
                                allowBlank: false,
                                minValue: comp.minValue,
                                maxValue: comp.maxValue,
                                allowDecimals: comp.allowDecimals,
                                decimalPrecision: comp.decimalPrecision,
                                decimalSeparator: comp.decimalSeparator,
                                allowNegative: comp.allowNegative,
                                trailingDecimals: comp.trailingDecimals
                            }),
                            renderer: function (value, metaData, record, rowIndex, colIndex, store) {
                                return self.checkWarning(self, value, metaData, record, rowIndex, colIndex, store);
                            }
                        });

                        bbarFields.push({
                            xtype: 'numberfield',
                            range: range,
                            rangeStart: rangeStart,
                            rangeEnd: rangeEnd,
                            width: comp.width,
                            emptyText: comp.emptyText,
                            allowBlank: comp.allowBlank,
                            hideLabel: comp.hideLabel,
                            fieldLabel: comp.fieldLabel,
                            minValue: comp.minValue,
                            maxValue: comp.maxValue,
                            allowDecimals: comp.allowDecimals,
                            decimalPrecision: comp.decimalPrecision,
                            decimalSeparator: comp.decimalSeparator,
                            allowNegative: comp.allowNegative,
                            msgTarget: 'qtip',
                            style: 'margin-right:20px'
                        });
                        break;
                    default:
                        gridColumns.push({
                            resizable: false,
                            fixed: true,
                            header: this.config.columnList[i].title,
                            width: this.config.columnWidth[i],
                            dataIndex: 'field' + i,
                            menuDisabled: true,
                            editor: new Ext.form.TextField({
                                allowBlank: false
                            })
                        });
                        bbarFields.push({
                            xtype: 'textfield',
                            width: comp.width,
                            emptyText: comp.emptyText,
                            allowBlank: comp.allowBlank,
                            hideLabel: comp.hideLabel,
                            fieldLabel: comp.fieldLabel,
                            minLength: comp.minLength,
                            maxLength: comp.maxLength,
                            style: 'margin-right:10px'
                        });
                }
            }
            bbarFields.push({
                xtype: 'button',
                handler: this.onAddRecord,
                icon: this.config.addPic,
                minWidth: 24,
                width: 24,
                listeners: {
                    'mouseout': function () {
                        this.getEl().addClass('x-btn-over');
                    }
                }
            });
            storeFields.push({
                name: 'fieldDel'
            });
            gridColumns.push({
                id: 'deleteIcon',
                width: 35,
                sortable: false,
                renderer: function (value, p, record, rowIndex, colIndex, store) {
                    return self.deleteColRenderer(self, record);
                },
                menuDisabled: true
            });

            Ext.apply(Ext.util.Format, {
                htmlEncode: function (value) {
                    return !value ? value : String(value).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
                },
                htmlDecode: function (value) {
                    return !value ? value : String(value).replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&");
                }
            });

            for (var i = 0; i < this.data.length; i++) {
                this.data[i].unshift(i);
            }

            Ext.apply(this, {
                store: new Ext.data.ArrayStore({
                    data: this.data,
                    fields: storeFields
                }),
                cm: new Ext.grid.ColumnModel({
                    columns: gridColumns
                }),
                stripeRows: true,
                mode: 'local',
                stateful: true,
                stateId: 'grid',
                columnLines: true,
                clicksToEdit: 1,
                trackMouseOver: false,
                autoEncode: true,
                enableColumnMove: false,
                bbar: [bbarFields]
            });

            this.on('afteredit', function (e) {
                this.getView().refresh();
            });

            Ext.customInputPanel.superclass.initComponent.apply(this, arguments);
            this.on('afterRender', function () {
                Ext.customInputPanel.superclass.afterRender.apply(this, arguments);
                this.afterRenderEvent();
            }, this);

            this.initialData = this.data;
        }
    });
    Ext.reg('customInputPanel', Ext.customInputPanel);


    var fieldsList = [{
        fieldType: 'number',
        range: 'qtyRange',
        rangeStart: true,
        emptyText: '',
        allowBlank: false,
        width: 80,
        hideLabel: true,
        fieldLabel: '',
        minValue: 1,
        maxValue: Number.POSITIVE_INFINITY,
        allowDecimals: true,
        decimalPrecision: 4,
        decimalSeparator: '.',
        allowNegative: false,
        trailingDecimals: 4
    }, {
        fieldType: 'number',
        range: 'qtyRange',
        rangeEnd: true,
        emptyText: '',
        allowBlank: false,
        width: 80,
        hideLabel: true,
        fieldLabel: '',
        minValue: 1,
        maxValue: Number.POSITIVE_INFINITY,
        allowDecimals: true,
        decimalPrecision: 4,
        decimalSeparator: '.',
        allowNegative: false,
        trailingDecimals: 4
    }, {
        fieldType: 'number',
        range: false,
        emptyText: '',
        allowBlank: false,
        width: 80,
        hideLabel: true,
        fieldLabel: '',
        minValue: Number.NEGATIVE_INFINITY,
        maxValue: Number.POSITIVE_INFINITY,
        allowDecimals: true,
        decimalPrecision: 2,
        decimalSeparator: '.',
        allowNegative: true,
        trailingDecimals: 2
    }, {
        fieldType: 'number',
        range: false,
        emptyText: '',
        allowBlank: false,
        width: 87,
        hideLabel: true,
        fieldLabel: '',
        minValue: Number.NEGATIVE_INFINITY,
        maxValue: Number.POSITIVE_INFINITY,
        allowDecimals: true,
        decimalPrecision: 2,
        decimalSeparator: '.',
        allowNegative: false,
        trailingDecimals: 2
    }];

    var columnList = [{
        title: "Range Start"
    }, {
        title: "Range End"
    }, {
        title: "Cost"
    }, {
        title: "Sell"
    }];

    var dataList = [
        [0, 2, 4, 5],
        [1, 1, 2, 2],
        [10, 5, 6, 1]
    ];

    var weightsPanel = new Ext.customInputPanel({
        id: 'rates',
        height: 255,
        post: true,
        width: 475,
        name: 'rates',
        data: dataList,
        config: {
            outputFormat: 'OLDPRICES',
            fieldList: fieldsList,
            columnList: columnList,
            columnWidth: [100, 100, 100, 100],
            delPic: 'http://dashasalo.com/static/uploads/images/2013/06/20/delete.png',
            addPic: 'http://dashasalo.com/static/uploads/images/2013/06/20/add.png',
            startMinValue: 3
        }
    });


    var formPanelObj = new Ext.FormPanel({
        id: 'mainform',
        header: false,
        frame: true,
        width: 475,
        layout: 'form',
        defaultType: 'textfield',
        autoHeight: true,
        items: weightsPanel
    });


    var windowObj = new Ext.Window({
        id: 'MainWindow',
        title: "Editable Grid example",
        closable: false,
        plain: true,
        draggable: false,
        resizable: false,
        layout: 'fit',
        width: 485,
        height: 305,
        items: formPanelObj
    });
    windowObj.show();
});