'use strict';

	var pData = {
		general: {},
		httpmethods: [],
		parameters: [],
		paths: [],
		statuscodes: [],
		errors: []
	};

	var errors = {
		general: [],
		httpmethods: [],
		parameters: [],
		paths: [],
		statuscodes: [],
		errors: []
	};

	var categories = ['summary', 'general', 'http-methods', 'paths', 'parameters', 'status-codes', 'errors'];

	var allowedHttpMethods = ['POST', 'PUT', 'GET', 'DELETE'];
	var allowedHostsExt = ['lgw.att.com', 'api.att.com'];
	var jsdata = '';

	var naming = 'lowerCamel';
	var isExternal = true;

	var statuscodes = {
		get: {
			success: '200|204|206',
			mandatory: ['400', '401', '403', '404', '405', '406', '410', '429', '431', '500', '503'],
			optional: ['408','414', '416', '426', '451', '501', '502', '504']
		},
		post: {
			success: '200|201|202|204',
			mandatory: ['400', '401', '403', '404', '405', '406', '410', '411', '413', '415', '429', '431', '500', '503'],
			optional: ['408', '409', '412', '417', '426', '428', '451', '501', '502', '504']
		},
		put: {
			success: '200|201|202|204',
			mandatory: ['400', '401', '403', '404', '405', '406', '409', '410', '411', '413', '415', '429', '431', '500', '503'],
			optional: ['408', '412', '417', '426', '428', '451', '501', '502', '504']
		},
		delete: {
			success: '200|202|204',
			mandatory: ['400', '401', '403', '404', '405', '406', '409', '410', '415', '429', '431', '500', '503'],
			optional: ['408', '412', '414', '417', '426', '451', '501', '502', '504']
		}
	};


	var errordetails = {
		STATUSCODES_GET_MAN: {
			short: 'Missing mandatory HTTP status codes: $1',
			long: 'The HTTP method GET should have the following status codes possible, and should be accounted for in the design of the API: '
		}

	};

	/**
	* @description returns the list of categories
	*/
	var getCategories = function() {
		return categories;
	};

	/**
	* @description capitalizes and splits string at '-'
	* @param {string} title - string to capitalize
	*/
	var capitalize = function(string) {
		var ret = [];
		string.split('-').forEach(function(k) {
			ret.push(k.charAt(0).toUpperCase() + k.substr(1));
		});

		return ret.join(' ');
	};

var xcnt = 0;

	var getDefinitions = function(obj) {

		/**
		* loop through all the definitions 
		*/
		console.log('NUMBER OF DEF: ' + xcnt + ' '+ Object.keys(obj).length);
		xcnt++;
		Object.keys(obj).forEach(function(key, index) {
			// console.log('DEFN: ' + key);
			var values = [];
			if (obj[key].hasOwnProperty('properties')) {
				values = getProps('', obj[key].properties);
			} else if (obj[key].hasOwnProperty('type')) {
				// console.log(key + ' ' + obj[key].type);
				values.push(key + ':' + obj[key].type);
			}
			pData.parameters.push(createDefinitionObj(key, values));
		});
	};


	/**
	* @description gets the properties of 'obj', with a name prefix of 'prefix'
	* @param {string} prefix - the name to prefix to any properties found (for recursion)
	* @param {string} obj - the starting object within the file to start searching
	*/
	var getProps = function(prefix, obj) {
		var values = [];

		/**
		* loop through all the keys extracted from the object
		*/
		Object.keys(obj).forEach(function(key, index) {
			// console.log('PROPS: ' + key);
			var type = 'object', desc = '';
			
			var names = [];
			if (prefix) {
				names.push(prefix);
			}
			names.push(key);

			if (obj[key].type) {
				type = obj[key].type;
			}

			/**
			* if there is an 'items' object, then look in there for either
			* a '$ref' to other object, or to get the 'type' of the property
			* If no 'items' object, then check if there is a '$ref' or 'type'
			*/
			if (obj[key].hasOwnProperty('items')) {

				if (obj[key].items.hasOwnProperty('$ref')) {
						var v = obj[key].items['$ref'];
						// getProps(names.join('.'), jsdata.schemas[v].properties).forEach(function(kk, ii) {
						// 	names.push(kk);
						// 	values.push(kk);
						// });
						// type = v;
						values.push(names.join('.') + ':' + v);
				} else if (obj[key].items.hasOwnProperty('type')) {
					values.push(names.join('.') + ':' + obj[key].items.type);
				}
			} else if (obj[key].hasOwnProperty('$ref')) {
				var v = obj[key]['$ref'];
				// getProps(names.join('.'), jsdata.schemas[v].properties).forEach(function(kk, ii) {
				// 	// names.push(kk);

				// 	names.push(kk);
				// 	values.push(kk);
				// });
				// type = v;
				values.push(names.join('.') + ':' + v);
			} else if (obj[key].hasOwnProperty('properties')) {
				getProps(names.join('.'), obj[key].properties).forEach(function(kk, ii) {
					names.push(kk);
					values.push(kk);
				});
			} else if (obj[key].hasOwnProperty('type')) {
					values.push(names.join('.') + ':' + obj[key].type);
			} else {

				values.push(names.join('.') + ':' + type);
			}
		
		});

		return values;
	};


	/**
	* @description retrieves the CSV file type based on the name embedded in the file name
	* @param {string} fname - the file name
	*/
	var getCsvFileType = function(fname) {
		var dash = (fname.lastIndexOf("-") - 1 >>> 0) + 2;
		var dot = (fname.lastIndexOf(".") - 1 >>> 0) + 1;
		var ftype = fname.slice(dash, dot);

		return ftype;
	};


	/**
	* @description creates an object that gets added to errors object
	* @param {string} name - The name of the item that is in error
	* @param {string} level - info, warning or error
	* @param {string} msg - error message to display
	*/
	var createErrorObj = function(name, level, msg) {
		var obj = {};
		obj.name = name;
		obj.msg = msg;
		obj.level = level;

		return obj;
	};

	/**
	* @description creates an object that gets added to statuscodes
	* @param {string} path - resource path
	* @param {string} method - HTTP method
	* @param {array} statuses - HTTP statuses
	*/
	var createStatusObj = function(path, method, statuses) {
		var obj = {};
		obj.path = path;
		obj.method = method;
		obj.statuses = statuses;

		return obj;
	};

	/**
	* @description creates an object that gets added to parameters
	* @param {string} definition - defintion within the file
	* @param {array} params - parameters that are defined under the definition
	*/
	var createDefinitionObj = function(definition, params) {
		var obj = {};
		obj.definition = definition;
		obj.params = params;

		return obj;
	};

	/**
	* @description creates an object that gets added to statuscodes
	* @param {string}  - The title of the book
	* @param {string} author - The author of the book
	*/
	var createMethodObj = function(path, method, produces, consumes, paramlocation) {
		var obj = {};
		obj.path = path;
		obj.method = method;
		obj.produces = produces;
		obj.consumes = consumes;
		obj.paramlocation = paramlocation;

		return obj;
	};

	/**
	* @description checks the base path
	*/
	var checkBasePath = function() {
		var x = [];
		var msg = '';
		x.push(pData.general.basePath);
		checkPathStructure('basePath', x);

		if (! (pData.general.basePath.match(/^(\/.*){1,3}\/v[0-9]/) || []).length) {

			if (! (pData.general.basePath.match(/v[0-9]/g) || []).length) {
				msg = "basePath should have version string (v[0-9], e.g. v1)";
				errors.paths.push(createErrorObj(pData.general.basePath, 'error', msg));
			} else {
				msg = "basePath should be of the form {/routing}*{/APIName}/{version}{/resourcePath}, where routing can contain 0-2 path segments.";
				errors.paths.push(createErrorObj(pData.general.basePath, 'error', msg));
			}
		}

		if ((pData.general.basePath.match(/(\/)?flow\//) || []).length) {
			msg = "basePath should have 'flow' as a path segment <em>only</em> if the API is Flow based and is being exposed through BlackFlag";
			errors.paths.push(createErrorObj(pData.general.basePath, 'warning', msg));
		}

		return;
	};


	/**
	* @description checks the definitions in the file
	*/
	var checkDefinitions = function() {
		console.log('********** IN CHECK DEF');
		
		var refs = [];
		console.log('########PARAMS NUMBER: ' + pData.parameters.length);
		// var checked = [];
		pData.parameters.forEach(function(key, idx) {
			var checked = [];
			key.params.forEach(function(param, ii) {
				var ps = param.split(':');
				var par = ps[0];
				var type = ps[1];
				if (type.match(/^#\//)) {
					if (refs.indexOf(type) < 0) {
						refs.push(type);
					}
				}
				var errs = [];
				par.split('.').forEach(function(word) {
					if (checked.indexOf(word) >= 0) {
						console.log('CHECKED: ' + word);
						return;
					}
					checked.push(word);

					var obj = checkCase(word);
					if (Object.keys(obj).length) {
						obj.name = key.definition + ': ' + word;
						errs.push(obj);
						return;
					}
				});

				errs.forEach(function(E) {
					errors.parameters.push(createErrorObj(E.name, E.level, E.msg));
				});
			});
		});
	};

	/**
	* @description checks the words that make up a path
	* @param {array} paths - an array of paths
	*/
	var checkResources = function(paths) {
		paths.forEach(function(key, idx) {

			// remove first forward slashes for easier matching
			var nkeys = key.replace(/^[/]+|[/]$/, '').split('/');
			var k = nkeys[nkeys.length-1];
			var k2 = nkeys[nkeys.length-2];
			var msg = '', level='';

			// check if collection is plural
			if ((k.match(/^{.*}$/)) && (k2[k2.length-1] != 's')) {
				msg = 'collections (' + k2 + ') must be plural';
				errors.paths.push(createErrorObj(key, 'error', msg));
			}

			if (k.match(/create|make|delete|update|get|del|remove/i)) {
				msg = "resource must be a noun";
				errors.paths.push(createErrorObj(key, 'error', msg));
			}

			var obj = checkCase(k);
			if (Object.keys(obj).length) {
				errors.paths.push(createErrorObj(key, obj.level, obj.msg));
			}
			// if (naming === 'lowerCamel') {
			// 	if (/^[A-Z_-]+|[_-]+/.test(k)) {
			// 		msg = "resource must be lowerCamel case";
			// 		errors.paths.push(createErrorObj(key, 'error', msg));
			// 	}
			// } else if (naming === 'UpperCamel') {
			// 	if (k.match(/^[a-z_-]+|[_-]+/)) {
			// 		msg = "resource must be UpperCamel case";
			// 		errors.paths.push(createErrorObj(key, 'error', msg));
			// 	}
			// } else if (naming === 'snake') {
			// 	if (k.match(/[_]/) == false) {
			// 		msg = "resource must be in snake_case";
			// 		errors.paths.push(createErrorObj(key, 'warning', msg));
			// 	}
			// }

		});

		return;
	};

	var checkCase = function(name) {
		var obj = {};

		if (naming === 'lowerCamel') {
			if (/^[A-Z_-]+|[_-]+/.test(name)) {
				obj.msg = "names must be lowerCamel case";
				obj.level = 'error';
			}
		} else if (naming === 'UpperCamel') {
			if (name.match(/^[a-z_-]+|[_-]+/)) {
				obj.msg = "names must be UpperCamel case";
				obj.level = 'error';
			}
		} else if (naming === 'snake') {
			if (name.match(/[_]/) == false) {
				obj.msg = "names must be in snake_case";
				obj.level = 'warning';
			}
		}

		return obj;
	};
	
	/**
	* @description checks if the paths have the correct path separator
	* @param {string} name - name of the path (paths or basePath)
	* @param {array} paths - array of paths
	*/
	var checkPathStructure = function(name, paths) {
		
		// var allpaths = pData.paths.push(jsdata.basePath);

		paths.forEach(function(key, idx) {
			var msg = '';
			var stripped = key.replace(/\/|{|}/g, '');

			if (key.match(/\/\//)) {
				msg = name + " can not have double forward slash";
				errors.paths.push(createErrorObj(key, 'error', msg));
			}
			// if (/\?|#|;|=|\s/i.test(key)) {
			if (stripped != encodeURIComponent(stripped)) {
				msg = name + " can not have reserved characters";
				errors.paths.push(createErrorObj(key, 'error', msg));
			}
			// not sure if this is redundant or needed
			if (! (key.match(/\//g) || []).length) {
				msg = name + " should have at least one forward slash";
				errors.paths.push(createErrorObj(key, 'warning', msg));
			}
			if (key[0] != '/') {
				msg = name + " should have leading forward slash";
				errors.paths.push(createErrorObj(key, 'error', msg));
			}
			if (key[key.length-1] === '/') {
				msg = name + " should not have forward slash at end of path";
				errors.paths.push(createErrorObj(key, 'warning', msg));
			}
		});

		return;
	};

	var checkStatusCodes = function(s) {
		
		s.forEach(function(key, idx) {
			var msg = '', name = '', obj = {};
			var method = s[idx].method.toLowerCase();
			if (method === 'post') {
				if (s[idx].statuses.indexOf('201') < 0) {
					msg = 'POST for <u>creating</u> resources should return HTTP status code of 201';
					msg += " (only show: " + s[idx].statuses.join(',') + ")";
					name = s[idx].method.toUpperCase() + ' ' + s[idx].path;
					obj = createErrorObj(name, 'warning', msg);
					errors.statuscodes.push(obj);
				}
			}

			// check mandatory status codes
			var man = [];
			if (typeof statuscodes[method] != 'undefined') {
				statuscodes[method].mandatory.forEach(function(k, i) {
					if (s[idx].statuses.indexOf(k)) {
						man.push(k);
					}
				});
			}
			if (man.length > 0) {
				msg = 'missing mandatory HTTP status codes: ' + man.join(', ');
				name = s[idx].method.toUpperCase() + ' ' + s[idx].path;
				obj = createErrorObj(name, 'error', msg);
				errors.statuscodes.push(obj);
			}

			// check optional status codes
			var opt = [];
			if (typeof statuscodes[method] != 'undefined') {
				statuscodes[method].optional.forEach(function(k, i) {
					if (s[idx].statuses.indexOf(k)) {
						opt.push(k);
					}
				});
			}
			if (opt.length > 0) {
				msg = 'missing optional HTTP status codes (verify if codes are needed): ' + opt.join(', ');
				name = s[idx].method.toUpperCase() + ' ' + s[idx].path;
				obj = createErrorObj(name, 'warning', msg);
				errors.statuscodes.push(obj);
			}
		});

		return;
	};


var checkMethods = function(s) {
		
	s.forEach(function(key, idx) {
		var msg = '', name = '', obj = {};
		var method = key.method.toUpperCase();

		if (allowedHttpMethods.indexOf(method) < 0) {
			msg = 'The only HTTP methods allowed are: ' + allowedHttpMethods.join(',');
			obj = createErrorObj(method + ' ' + key.path, 'error', msg);
			errors.httpmethods.push(obj);
		}

		if (method.match(/GET|DELETE/) && key.consumes.length > 0) {
			msg = method + ' HTTP methods must only <em>produce</em> (response body), not <em>consume</em> (request body)';
			obj = createErrorObj(method + ' ' + key.path, 'error', msg);
			errors.httpmethods.push(obj);
		}

		if (method === 'GET' && key.produces.length === 0) {
			msg = 'GET HTTP methods must <em>produce</em> (response body)';
			obj = createErrorObj(method + ' ' + key.path, 'error', msg);
			errors.httpmethods.push(obj);
		}

		if (method.match(/POST|PUT/) && key.consumes.length === 0) {
			msg = method + ' HTTP methods must <em>consume</em> (request body)';
			obj = createErrorObj(method + ' ' + key.path, 'error', msg);
			errors.httpmethods.push(obj);
		}
		if (method.match(/POST|PUT/) && key.paramlocation.indexOf('query') >= 0) {
			msg = method + ' HTTP methods must not have query parameters.';
			obj = createErrorObj(method + ' ' + key.path, 'error', msg);
			errors.httpmethods.push(obj);
		}

		if (method.match(/GET|DELETE/) && key.paramlocation.indexOf('body') >= 0) {
			msg = method + ' HTTP methods must not have request payloads (in=body).';
			obj = createErrorObj(method + ' ' + key.path, 'error', msg);
			errors.httpmethods.push(obj);
		}

		// the next 2 should probably be in a different category than HTTP methods.
		if ((key.produces.length != 0 && key.produces.indexOf('application/json') < 0) || key.produces.length > 1) {
			msg = 'Textual response payloads (produces) should only be in JSON format.';
			obj = createErrorObj(method + ' ' + key.path, 'warning', msg);
			errors.httpmethods.push(obj);
		}

		if ((key.consumes.length != 0 && key.consumes.indexOf('application/json') < 0) || key.consumes.length > 1) {
			msg = 'Textual request payloads (consumes) should only be in JSON format.';
			obj = createErrorObj(method + ' ' + key.path, 'warning', msg);
			errors.httpmethods.push(obj);
		}

	});

	return;
};


/**
* @description checks errors that fall into the General category
*/
var checkGeneral = function() {
	var msg = '', obj = {};
	if (pData.general.schemes.length != 1 || pData.general.schemes.indexOf('https') < 0) {
		msg = 'schemes must only have <em>https</em>';
		obj = createErrorObj(pData.general.schemes.join(','), 'error', msg);
		errors.general.push(obj);
	}

	// this might depend if it's being exposed externally or not.
	if (isExternal && allowedHostsExt.indexOf(pData.general.host) < 0) {
		msg = 'host names for externally exposed APIs must be either <em>lgw.att.com</em> or <em>api.att.com</em>';
		obj = createErrorObj(pData.general.host, 'error', msg);
		errors.general.push(obj);
	}

	if (pData.general.version === '2.0') {
		msg = "Consider upgrading to the newer <a href='https://www.openapis.org/' target='_blank'>OpenAPI</a> spec. The Swagger spec will be outdated, and has less features. You can convert your Swagger spec into OpenAPI online (e.g. <a href='https://github.com/mermade/swagger2openapi' target='_blank'>swagger2openapi</a>).";
		errors.general.push(createErrorObj('Version = ' + pData.general.version, 'info', msg));
	}

	return;
};

/**
* @description retrieves the errors for a specific type of check
* @param {string} type - paths, parameters, statuscodes, errors
*/
var getErrors = function(type) {
	type = type.replace('-', '');
	return errors[type];
};

/**
* @description retrieves the data for a specific type of check
* @param {string} type - paths, parameters, statuscodes, errors
*/
var getData = function(type) {
	return pData[type];
};

/**
* @description clears all the data to start over
*/
var clearData = function() {

	Object.keys(pData).forEach(function(key, idx) {
		if (Array.isArray(pData[key])) {
			pData[key].length = 0;
		} else {
			pData[key] = {};
		}
		
	});

	Object.keys(errors).forEach(function(key, idx) {
		errors[key].length = 0;
	});

	jsdata = '';

	return;
};
	/**
	* @description load CSV files into internal data structure
	* @param {string} filenames - variable number of filenames
	*/
	var loadCsv = function(type, data) {
		
		var jsonArray = [];
		var dataArray = data.split('\n');
		var head = dataArray[0].split(',');
		dataArray.splice(1).forEach(function(line) {
			line.split(',').forEach(function(val, idx) {
				console.log(head[idx] + ' = ' +val);
			});
	 	});

	 	return;
	};

	/**
	* @description load JSON (Swagger/OpenAPI) file into internal data structure
	* @param {string} data - the JSON data
	*/
	var loadJson = function(data) {
		var jsdata = JSON.parse(data);

		pData.general.basePath = jsdata.basePath;
		pData.general.host = jsdata.host;
		pData.general.schemes = jsdata.schemes;
		if (jsdata.swagger) {
			pData.general.version = jsdata.swagger;
		} else {
			pData.general.version = jsdata.openapi;
		}

		Object.keys(jsdata.paths).forEach(function(key, index) {
			pData.paths[index] = key;
			Object.keys(jsdata.paths[key]).forEach(function(k, i) {
				var arr = [];
				Object.keys(jsdata.paths[key][k].responses).forEach(function(kk, ii) {
					arr.push(kk);
				});
				pData.statuscodes.push(createStatusObj(key, k, arr));

				var produces = [];
				if (jsdata.paths[key][k].hasOwnProperty('produces')) {
					produces = jsdata.paths[key][k].produces;
				}

				var consumes = [];
				if (jsdata.paths[key][k].hasOwnProperty('consumes')) {
					consumes = jsdata.paths[key][k].consumes;
				}

				var loc = [];
				jsdata.paths[key][k].parameters.forEach(function(key, idx) {
					if (key.hasOwnProperty('in')) {
						loc.push(key.in);
					}
				});
				

				pData.httpmethods.push(createMethodObj(key, k, produces, consumes, loc));
			});

			
			// getProps('', pData.paths[index]).forEach(function(key, idx) {
			// 	// console.log(key);
			// });
		});

		getDefinitions(jsdata.definitions);

		return;
	};

	// if( typeof exports !== 'undefined' ) {
	//     if( typeof module !== 'undefined' && module.exports ) {
	//       exports = module.exports = jsonic;
	//     }
	//     exports.jsonic = jsonic;
 //  	} else {
 //    	root.jsonic = jsonic;
 //  	}
