"use strict";var loadedFiles=[],xlsdata=[],readers=[];function dragenter(e){$("droparea").addClass("darea-dragover")}function dragleave(e){$("droparea").removeClass("darea-dragover")}function dragover(e){e.stopPropagation(),e.preventDefault(),e.dataTransfer.dropEffect="copy"}function output(e){$("#droparea").append(txt)}function drop(e){e.stopPropagation(),e.preventDefault();var t=e.dataTransfer.files;t.length;$("#droparea-title").addClass("d-none");for(var a=0;a<t.length;a++){var r=t[a];$("#droparea-filelist").append("<li>"+t[a].name),genReader(r)}}function genReader(t){var e=new FileReader;readers.push(e),e.onerror=function(e){e.target.error.code,e.target.error.ABORT_ERR},e.onprogress=function(e){},e.onload=function(e){t.content=e.target.result,loadedFiles.push(t)},e.readAsText(t)}function addRow(e,t,a,r,l){var o=r;"error"===r&&(o="danger"),row=$("<tr class='table-"+o+"'></tr>"),cells="<td>"+t+"</td><td>"+a+"</td><td>"+l+"</td>",row.append(cells),$("#"+e+"-table-body").append(row);var n=[t,a,r,l];xlsdata[e].push(n)}function addSummaryRow(e,t,a,r){var l=t+a+r;"total"===e?(row="<tr><th>"+capitalize(e)+"</th><th class='table-info'>"+t+"</th><th class='table-warning'>"+a+"</th><th class='table-danger'>"+r+"</th><th>"+l+"</th></tr>",$("#summary-table-footer").append(row)):(row="<tr><td>"+capitalize(e)+"</td><td class='table-info'>"+t+"</td><td class='table-warning'>"+a+"</td><td class='table-danger'>"+r+"</td><td>"+l+"</td><tr>",$("#summary-table-body").append(row)),xlsdata.summary.push([capitalize(e),t,a,r,l])}function getFiles(e){$("#file-upload");if(0!==e.length){$("#droparea-title").addClass("d-none");var t=!0,a=!1,r=void 0;try{for(var l,o=e[Symbol.iterator]();!(t=(l=o.next()).done);t=!0){var n=l.value;genReader(n),$("#droparea-filelist").append("<li>"+n.name)}}catch(e){a=!0,r=e}finally{try{!t&&o.return&&o.return()}finally{if(a)throw r}}readFiles()}else alert("Select one or more files")}function readFiles(){var e=!0,t=!1,a=void 0;try{for(var r,l=loadedFiles[Symbol.iterator]();!(e=(r=l.next()).done);e=!0){var o=r.value;JSON.parse(o.content);loadJson(o.content),checkDefinitions(),checkGeneral(),checkPathStructure("paths",getData("paths")),checkResources(getData("paths")),checkBasePath(),checkStatusCodes(getData("statuscodes")),checkMethods(getData("httpmethods")),$("#export-btn").removeClass("disabled"),$("#clear-btn").removeClass("disabled"),xlsdata.summary=[],xlsdata.summary.push(["Category","# of Infos","# of Warnings","# on Errors","Total"]);var n=0,d=0,s=0;getCategories().forEach(function(t,e){if("summary"!==t.title){xlsdata[t.title]=[],xlsdata[t.title].push(t.columns);var a=0,r=0,l=0,o=1;getErrors(t.title).forEach(function(e){addRow(t.title,o,e.name,e.level,e.msg),o+=1,"warning"===e.level?a++:"error"===e.level?r++:"info"===e.level&&l++}),$("#"+t.title+"-issues").html("Total "+capitalize(t.title)+" issues: "+(a+r+l)+"; error: "+r+"; warning: "+a+"; info: "+l),addSummaryRow(t.title,l,a,r),s+=l,n+=a,d+=r}}),addSummaryRow("total",s,n,d)}}catch(e){t=!0,a=e}finally{try{!e&&l.return&&l.return()}finally{if(t)throw a}}}function clearTables(){getCategories().forEach(function(e){$("#"+e.title+"-table-body").children("tr").remove(),$("#"+e.title+"-issues").html(""),void 0!==xlsdata[e.title]&&(xlsdata[e.title].length=0)}),xlsdata=[],$("#summary-table-footer").children("tr").remove(),$("#droparea-title").removeClass("d-none"),$("#export-btn").addClass("disabled"),$("#clear-btn").addClass("disabled"),$("#droparea-filelist").text(""),$("#file-upload").val(""),loadedFiles.length=0}$(document).ready(function(){$('[data-toggle="tooltip"]').tooltip(),$("#analyze-btn").click(function(){0!==loadedFiles.length&&(readFiles(),$("#results").collapse("show"),$("#summary-tab").tab("show"))}),$("#cancel-btn").click(function(){clearTables(),clearData()}),$("#clear-btn").click(function(){clearTables(),clearData()}),$("#export-btn").click(function(){if(console.log("KEYS: "+Object.keys(xlsdata)),0!==Object.keys(xlsdata).length){var y={info:"D6DBDF",warning:"F5CBA7",error:"F1948A"};XlsxPopulate.fromBlankAsync().then(function(e){var t=!0,a=!1,r=void 0;try{for(var l,o=getCategories()[Symbol.iterator]();!(t=(l=o.next()).done);t=!0){var n=l.value,d=e.addSheet(capitalize(n.title)),s=1,i=!0,c=!1,u=void 0;try{for(var f,h=xlsdata[n.title][Symbol.iterator]();!(i=(f=h.next()).done);i=!0){var p=f.value,v=p[2];d.cell("A"+s).value([p]);var m="A"+s+":D"+s;void 0!==y[v]&&d.range(m).style("fill",y[v]),s++}}catch(e){c=!0,u=e}finally{try{!i&&h.return&&h.return()}finally{if(c)throw u}}d.row(1).style("bold",!0)}}catch(e){a=!0,r=e}finally{try{!t&&o.return&&o.return()}finally{if(a)throw r}}var g=xlsdata.summary.length;e.sheet("Summary").range("B2:B"+g).style("fill",y.info),e.sheet("Summary").range("C2:C"+g).style("fill",y.warning),e.sheet("Summary").range("D2:D"+g).style("fill",y.error),e.deleteSheet("Sheet1"),e.outputAsync().then(function(e){var t="restlint-"+(new Date).toISOString()+".xlsb";if(window.navigator&&window.navigator.msSaveOrOpenBlob)window.navigator.msSaveOrOpenBlob(e,t);else{var a=window.URL.createObjectURL(e),r=document.createElement("a");document.body.appendChild(r),r.href=a,r.download=t,r.click(),window.URL.revokeObjectURL(a),document.body.removeChild(r)}})})}})});