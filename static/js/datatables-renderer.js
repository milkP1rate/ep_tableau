if (typeof (DatatablesRenderer) == 'undefined') var DatatablesRenderer = function () {
    var dRenderer = {
        render: function (context, element, attributes) {
            var renderer = new DatatablesRenderer.Renderer();
            element.innerHTML = renderer.getHtml(element.innerHTML, attributes, context);

            // Strange behaviour from IE. 
            // It comes here 2 times per row, so I have to stop rendering a second time to avoid desctruction of the rendering
            if (context != "timeslider" && element.innerHTML && element.innerHTML.indexOf("payload") != 2) {
                return;
            }

            if (context == "timeslider") {
                var regex1 = new RegExp('(^\<span\ class=""\>)', 'i');
                var regex2 = new RegExp('(\<\/span\>)$', 'i');
                code = renderer.htmlspecialchars_decode(element.innerHTML)
                    .replace(regex1, '')
                    .replace(regex2, '');
            } else if (context == "export") {
                code = element.text;
            } else code = element.innerHTML;

            if (context == "export") {
                // For export, I need to send back the formatted text
                return renderer.getHtml(code, attributes, context);
            } else {
                // For others, I need to modify the content of the element
                element.innerHTML = renderer.getHtml(code, attributes, context);
            }
        }
    }; // end of dRenderer
    dRenderer.Renderer = function () {
    };
    dRenderer.Renderer.prototype = {
        createDefaultTblProperties: function (authors) {
            return {
                borderWidth: "1",
                cellAttrs: [],
                width: "100",
                rowAttrs: {},
                colAttrs: [],
                authors: {}
            };
        },
        buildTabularData: function (tblJSONObj, tblProperties, renderingContext) {
            // var tblId = tblJSONObj.tblId;
            var tblClass = tblJSONObj.tblClass;
            // var tdClass = tblJSONObj.tdClass;
            var trClass = tblJSONObj.trClass;
            // var payload = tblJSONObj.payload;
            var rowAttrs, singleRowAttrs, cellAttrs, colAttrs;
            var tblWidth, tblHeight, tblBorderWidth, tblBorderColor;

            if (!tblProperties || tblProperties.length == 0) {
                tblProperties = this.createDefaultTblProperties();
            }

            rowAttrs = tblProperties.rowAttrs;
            singleRowAttrs = rowAttrs.singleRowAttrs;
            cellAttrs = tblProperties.cellAttrs;
            colAttrs = tblProperties.colAttrs;
            tblWidth = tblProperties.width || "100";
            tblHeight = tblProperties.height || "15";
            tblBorderWidth = tblProperties.borderWidth || 0;
            tblBorderColor = tblProperties.borderColor || "grey";


            var authors = tblProperties.authors;
            var printViewTBlStyles = "table-layout:fixed !important;border-collapse:collapse!important;";
            if (renderingContext == "export") printViewTBlStyles += "margin-bottom: -17px;";
            var printViewTblTDStyles = "padding: 5px 7px;word-wrap: break-word!important;"
            var bordersBottom = "border-bottom:" + tblBorderWidth + "px solid " + tblBorderColor;
            var bordersTop = "border-top:" + tblBorderWidth + "px solid " + tblBorderColor;
            var rowVAlign = rowAttrs.rowVAlign || "left";
            var rows = tblJSONObj.payload;
            var evenRowBgColor = rowAttrs.evenBgColor || "#FFFFFF";
            var oddRowBgColor = rowAttrs.oddBgColor || null;

            var htmlTbl = "<table class='" + tblClass + "' style='" + printViewTBlStyles + "background-color:white;width:" + tblWidth + "%!important;height:" + tblHeight + "px!important;'><tbody>";

            // the tables contains only one row, no need to do a FOR
            for (var j = 0, rl = rows.length; j < rl; j++) {
                var tds = rows[j];
                //console.log("draw table", tds, tblProperties);
                var rowBgColor = oddRowBgColor;
                if (!rowBgColor) {
                    rowBgColor = evenRowBgColor;
                }
                htmlTbl += "<tr style='vertical-align:" + rowVAlign + ";background-color:" + rowBgColor + "; " + bordersBottom + "!important;";
                if (tblProperties.isFirstRow) htmlTbl += " " + bordersTop + "!important;";
                htmlTbl += "' class='" + trClass + "'>";
                var preHeader = j == 0 ? "{\"payload\":[[\"" : "";
                htmlTbl += "<td class='regex-delete'  name='payload' class='hide-el overhead' style='display:none;'>" + preHeader + "</td>";
                var singleRowAttr = typeof (singleRowAttrs) == 'undefined' || singleRowAttrs == null ? null : singleRowAttrs[j];
                for (var i = 0, tl = tds.length; i < tl; i++) {
                    var cellAttr = typeof (cellAttrs[j]) == 'undefined' || cellAttrs[j] == null ? null : cellAttrs[j][i];
                    var cellStyles = this.getCellAttrs(singleRowAttr, cellAttr, colAttrs[i], authors, i, j);

                    var borderTop = "";
                    if (tblBorderWidth == 0) {
                        borderTop = " border-top: 0px solid white !important;";
                    }
                    var colVAlign = typeof (colAttrs[i]) == 'undefined' || colAttrs[i] == null ? "" : "align='" + colAttrs[i].colVAlign + "'";
                    var quoteAndComma = "\",\"";
                    var delimCell = "<td class='regex-delete' name='delimCell' id='" + "' class='hide-el overhead' style='display:none;'>" + quoteAndComma + "</td>";
                    var lastCellBorder = "";
                    if (i == tl - 1) {
                        delimCell = "";
                        lastCellBorder = "border-right:" + tblBorderWidth + "px solid " + tblBorderColor + "!important;";
                        quoteAndComma = "";
                    }
                    tds[i] = this.setLinks(tds[i]);
                    if (tds[i].indexOf('/r/n') != -1) {
                        let cellsWithBr = "";
                        var tdText = tds[i].split('/r/n');
                        for (var k = 0; k < tdText.length; k++) {
                            if (k < tdText.length - 1) {
                                cellsWithBr += tdText[k] + "<label value='tblBreak' class='hide-el' style='display:none;'>/r/n</label><label class='tblBreak' style='display:block;'></label>";
                            } else cellsWithBr += tdText[k];
                        }
                        htmlTbl += "<td  name='tData' " + colVAlign + " style='" + printViewTblTDStyles + cellStyles + " border-left:" +
                            tblBorderWidth + "px solid " + tblBorderColor + ";" + borderTop + lastCellBorder + "' >" + cellsWithBr +
                            "<br value='tblBreak'></td>" + delimCell;
                    } else {
                        htmlTbl += "<td name='tData' " + colVAlign + " style='" + printViewTblTDStyles + cellStyles + lastCellBorder + " border-left:" + tblBorderWidth + "px solid " + tblBorderColor + ";" + borderTop + "' >" + tds[i] + "" + "<br value='tblBreak'></td>" + delimCell
                    }
                }
                var bracketAndcomma = "\"]],\"tblId\":\"1\",\"tblClass\":\"data-tables\", \"tblProperties\":" + JSON.stringify(tblProperties) + "}";
                htmlTbl += "<td class='regex-delete' name='bracketAndcomma' class=' hide-el overhead' style='display:none;'>" + bracketAndcomma + "</td>";
                htmlTbl += "</tr>";
            }
            htmlTbl += "</tbody></table>";
            return htmlTbl;
        },
        getCellAttrs: function (singleRowAttr, cellAttr, colAttr, authors, cell, row) {
            var attrsJSO = {};
            var colWidth = typeof (colAttr) == 'undefined' || colAttr == null ? "" : colAttr.width || "";
            attrsJSO['width'] = colWidth + 'px';
            var cellBgColor = "";
            //row highlight
            if (typeof (singleRowAttr) != 'undefined' && singleRowAttr != null) {
                let bgColor = singleRowAttr.bgColor;
                if (typeof (bgColor) != 'undefined' && bgColor != null && bgColor != '#FFFFFF') {
                    cellBgColor = bgColor;
                }
            }
            //col highlight
            if (typeof (colAttr) != 'undefined' && colAttr != null) {
                let bgColor = colAttr.bgColor;
                if (typeof (bgColor) != 'undefined' && bgColor != null && bgColor != '#FFFFFF') {
                    cellBgColor = bgColor;
                }
            }
            cellBgColor = typeof (cellAttr) == 'undefined' || cellAttr == null ? cellBgColor : cellAttr.bgColor || cellBgColor;
            attrsJSO['background-color'] = cellBgColor;
            var cellHeight = typeof (cellAttr) == 'undefined' || cellAttr == null ? "" : cellAttr.height || "";
            attrsJSO['height'] = cellHeight + 'px';
            var cellVAlign = typeof (cellAttr) == 'undefined' || cellAttr == null ? "" : cellAttr.vAlign || "";
            attrsJSO['vertical-align'] = cellVAlign;
            var cellHAlign = typeof (cellAttr) == 'undefined' || cellAttr == null ? "" : cellAttr.hAlign || "";
            attrsJSO['text-align'] = cellHAlign;
            var cellFont = typeof (cellAttr) == 'undefined' || cellAttr == null ? "" : cellAttr.fontFamily || "";
            attrsJSO['font-family'] = cellFont;
            var cellFontSize = typeof (cellAttr) == 'undefined' || cellAttr == null ? "" : cellAttr.fontSize || "";
            attrsJSO['font-size'] = cellFontSize + 'px';
            var cellFontWeight = typeof (cellAttr) == 'undefined' || cellAttr == null || typeof (cellAttr.fontWeight) == 'undefined' ? "" : cellAttr.fontWeight || "";
            attrsJSO['font-weight'] = cellFontWeight;
            var cellFontStyle = typeof (cellAttr) == 'undefined' || cellAttr == null || typeof (cellAttr.fontStyle) == 'undefined' ? "" : cellAttr.fontStyle || "";
            attrsJSO['font-style'] = cellFontStyle;
            var cellTextDecoration = typeof (cellAttr) == 'undefined' || cellAttr == null || typeof (cellAttr.textDecoration) == 'undefined' ? "" : cellAttr.textDecoration || "";
            attrsJSO['text-decoration'] = cellTextDecoration;
            var attrsString = "";
            for (var attrName in attrsJSO) {
                if (attrName && attrsJSO[attrName] != "" && attrsJSO[attrName] != "NaNpx" && attrsJSO[attrName] != "px") attrsString += attrName + ":" + attrsJSO[attrName] + " !important;";
            }
            return attrsString;
        },
        htmlspecialchars_decode: function (string) {
            string = string.toString()
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#0*39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&');

            return string;
        },
        setLinks: function (data) {
            data = data.replace(/(https?:\/\/[^\s]+)/ig, "<a href='\$1' target='blank'>\$1</a>");
            return data;
        },
        getHtml: function (code, attributes, renderingContext) {
            var JSONCode = "";
            var html = "";
            try {
                JSONCode = JSON.parse(code);
                tblProperties = JSONCode.tblProperties;
                otherProps = attributes ? JSON.parse(attributes) : null;

                if (tblProperties && attributes) {
                    tblProperties = Object.assign(tblProperties, otherProps);
                }

                if (!tblProperties && attributes) {
                    tblProperties = JSON.parse(attributes);
                }
                html = this.buildTabularData(JSONCode, tblProperties, renderingContext);
            } catch (error) { }
            return html;
        },
    };
    return dRenderer;
}(); // end of anonymous function
// CommonJS
typeof (exports) != 'undefined' ? exports.DatatablesRenderer = DatatablesRenderer : null;
