jQuery.sap.declare("com.james.spectre.search.Component");
jQuery.sap.require("com.james.spectre.search.MyRouter");

sap.ui.core.UIComponent.extend("com.james.spectre.search.Component", {
	metadata: {
		name: "SpectreSearch",
		version: "1.0",
		includes: [],
		dependencies: {
			libs: ["sap.m", "sap.ui.layout"],
			components: []
		},

		rootView: "com.james.spectre.search.view.App",

		config: {
			resourceBundle: "i18n/messageBundle.properties",
			serviceConfig: {
				name: "NorthwindModel",
				serviceUrl: "/destinations/Spectre/SpectreService.svc/"
			}
		},

		routing: {
			config: {
				routerClass: com.james.spectre.search.MyRouter,
				viewType: "XML",
				viewPath: "com.james.spectre.search.view",
				targetAggregation: "detailPages",
				clearTarget: false
			},
			routes: [{
				pattern: "",
				name: "main",
				view: "Master",
				targetAggregation: "masterPages",
				targetControl: "idAppControl",
				subroutes: [{
					pattern: "{entity}/:tab:",
					name: "detail",
					view: "Detail"
				}]
			}, {
				name: "catchallMaster",
				view: "Master",
				targetAggregation: "masterPages",
				targetControl: "idAppControl",
				subroutes: [{
					pattern: ":all*:",
					name: "catchallDetail",
					view: "NotFound",
					transition: "show"
				}]
			}]
		}
	},

	init: function() {
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

		var mConfig = this.getMetadata().getConfig();

		// Always use absolute paths relative to our own component
		// (relative paths will fail if running in the Fiori Launchpad)
		var oRootPath = jQuery.sap.getModulePath("com.james.spectre.search");

		// Set i18n model
		var i18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl: [oRootPath, mConfig.resourceBundle].join("/")
		});
		this.setModel(i18nModel, "i18n");

		var sServiceUrl = mConfig.serviceConfig.serviceUrl;

		//This code is only needed for testing the application when there is no local proxy available
		var bIsMocked = jQuery.sap.getUriParameters().get("responderOn") === "true";
		// Start the mock server for the domain model
		if (bIsMocked) {
			this._startMockServer(sServiceUrl);
		}

		// Create and set domain model to the component
		var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, {
			json: true,
			loadMetadataAsync: true
		});
		oModel.attachMetadataFailed(function() {
			this.getEventBus().publish("Component", "MetadataFailed");
		}, this);
		this.setModel(oModel);

		// Set device model
		var oDeviceModel = new sap.ui.model.json.JSONModel({
			isTouch: sap.ui.Device.support.touch,
			isNoTouch: !sap.ui.Device.support.touch,
			isPhone: sap.ui.Device.system.phone,
			isNoPhone: !sap.ui.Device.system.phone,
			listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
			listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive"
		});
		oDeviceModel.setDefaultBindingMode("OneWay");
		this.setModel(oDeviceModel, "device");

		// Create value list model
		var valueLists = new sap.ui.model.json.JSONModel();
		this.setModel(valueLists, "values");
		jQuery.sap.delayedCall(0, this, function () {
			this.loadValueList("/Suppliers");
			this.loadValueList("/Categories");
		});

		this.getRouter().initialize();
	},

	_startMockServer: function(sServiceUrl) {
		jQuery.sap.require("sap.ui.core.util.MockServer");
		var oMockServer = new sap.ui.core.util.MockServer({
			rootUri: sServiceUrl
		});

		var iDelay = +(jQuery.sap.getUriParameters().get("responderDelay") || 0);
		sap.ui.core.util.MockServer.config({
			autoRespondAfter: iDelay
		});

		oMockServer.simulate("model/metadata.xml", "model/");
		oMockServer.start();

		sap.m.MessageToast.show("Running in demo mode with mock data.", {
			duration: 4000
		});
	},

	loadValueList: function(listId, async) {
		if (typeof(async) === "undefined") { async = true; }
		var list = this.getModel("values").getProperty(listId);
		if (!list) {
			var that = this;
			this.getModel().read(
					listId,
					null, null, async,
					function(data) { 
						that.getModel("values").setProperty(listId, data.results);
					}
				);
		}
	},
	
	getValue: function(key, valueListName, keyName, valueName) {
		this.loadValueList(valueListName, false);
		var valueList = this.getModel("values").getProperty(valueListName);
		var entity = valueList.find(function(ele) { 
			if (ele[keyName] === key) { 
				return ele; 
			}});
		if (typeof(valueName) === "undefined") {
			return entity;
		} else {
			return entity ? entity[valueName] : "-";
		}
	},
	
	getEventBus: function() {
		return sap.ui.getCore().getEventBus();
	}
});